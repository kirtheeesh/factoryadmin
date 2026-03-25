import express from 'express';
import pool from '../config/db';
import { authenticateAdmin } from '../middleware/auth';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const router = express.Router();

// Get all pending sales requests
router.get('/requests', authenticateAdmin, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT sr.*, c.name as customer_name 
            FROM sales_requests sr
            LEFT JOIN sales_customers c ON sr.customer_id = c.id
            ORDER BY sr.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching sales requests' });
    }
});

// Get sales request details
router.get('/requests/:id', authenticateAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const requestRes = await pool.query(`
            SELECT sr.*, c.name as customer_name 
            FROM sales_requests sr
            LEFT JOIN sales_customers c ON sr.customer_id = c.id
            WHERE sr.id = $1
        `, [id]);
        
        if (requestRes.rows.length === 0) return res.status(404).json({ message: "Request not found" });
        
        const itemsRes = await pool.query('SELECT * FROM sales_request_items WHERE sales_request_id = $1', [id]);
        
        res.json({
            ...requestRes.rows[0],
            items: itemsRes.rows
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error fetching request details" });
    }
});

// Update sales request
router.put('/requests/:id', authenticateAdmin, async (req, res) => {
    const { id } = req.params;
    const { items, total_amount } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query('UPDATE sales_requests SET total_amount = $1 WHERE id = $2', [total_amount, id]);
        await client.query('DELETE FROM sales_request_items WHERE sales_request_id = $1', [id]);
        for (const item of items) {
            await client.query(
                'INSERT INTO sales_request_items (sales_request_id, product_id, product_name, quantity, unit_price, line_total) VALUES ($1, $2, $3, $4, $5, $6)',
                [id, item.product_id, item.product_name, item.quantity, item.unit_price, item.line_total]
            );
        }
        await client.query('COMMIT');
        res.json({ message: 'Request updated' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ message: 'Error updating request' });
    } finally {
        client.release();
    }
});

// Approve sales request
router.post('/requests/:id/approve', authenticateAdmin, async (req, res) => {
    const { id } = req.params;
    const { approved_by } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const requestRes = await client.query('SELECT * FROM sales_requests WHERE id = $1', [id]);
        if (requestRes.rows.length === 0) throw new Error("Request not found");
        const sr = requestRes.rows[0];
        
        // Update status
        await client.query('UPDATE sales_requests SET status = $1, approved_by = $2 WHERE id = $3', ['Approved', approved_by, id]);
        
        // Create history entry
        const historyRes = await client.query(
            `INSERT INTO sales_history 
            (batch_number, invoice_number, sales_request_id, customer_id, customer_name_manual, total_amount, status, approved_by) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
            [sr.batch_number, sr.batch_number, sr.id, sr.customer_id, sr.customer_name_manual, sr.total_amount, 'Approved', approved_by]
        );
        const historyId = historyRes.rows[0].id;
        
        // Copy items
        const itemsRes = await client.query('SELECT * FROM sales_request_items WHERE sales_request_id = $1', [id]);
        for (const item of itemsRes.rows) {
            await client.query(
                `INSERT INTO sales_history_items 
                (sales_history_id, product_id, product_name, quantity, unit_price, line_total) 
                VALUES ($1, $2, $3, $4, $5, $6)`,
                [historyId, item.product_id, item.product_name, item.quantity, item.unit_price, item.line_total]
            );
        }
        
        await client.query('COMMIT');
        res.json({ message: 'Request approved and moved to history' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ message: 'Error approving request' });
    } finally {
        client.release();
    }
});

// Reject sales request
router.post('/requests/:id/reject', authenticateAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('UPDATE sales_requests SET status = $1 WHERE id = $2', ['Rejected', id]);
        res.json({ message: 'Request rejected' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error rejecting request' });
    }
});

// Get all invoices (history)
router.get('/invoices', authenticateAdmin, async (req, res) => {
    try {
        // Return both historical invoices and current requests formatted for the UI
        const history = await pool.query(`
            SELECT h.*, 
                   COALESCE(c.name, h.customer_name_manual) as customer_name, 
                   'approved' as approval_status, 
                   h.created_at as invoice_date,
                   (SELECT json_agg(i) FROM (
                       SELECT product_name, quantity, unit_price, line_total 
                       FROM sales_history_items 
                       WHERE sales_history_id = h.id
                   ) i) as items
            FROM sales_history h
            LEFT JOIN sales_customers c ON h.customer_id = c.id
            ORDER BY h.created_at DESC
        `);
        
        const requests = await pool.query(`
            SELECT sr.*, 
                   COALESCE(c.name, sr.customer_name_manual) as customer_name, 
                   CASE WHEN sr.status = 'Pending approval' THEN 'pending' ELSE LOWER(sr.status) END as approval_status, 
                   sr.created_at as invoice_date,
                   (SELECT json_agg(i) FROM (
                       SELECT product_name, quantity, unit_price, line_total 
                       FROM sales_request_items 
                       WHERE sales_request_id = sr.id
                   ) i) as items
            FROM sales_requests sr
            LEFT JOIN sales_customers c ON sr.customer_id = c.id
            WHERE sr.status != 'Approved'
            ORDER BY sr.created_at DESC
        `);

        res.json([...requests.rows, ...history.rows]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching invoices' });
    }
});

// ==========================================
// CUSTOMER ROUTES
// ==========================================

// Get all customers
router.get('/customers', authenticateAdmin, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM sales_customers ORDER BY name ASC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching customers' });
    }
});

// Add new customer
router.post('/customers', authenticateAdmin, async (req, res) => {
    const { name, category, address, phone_number, alternate_phone_number, email, gst } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO sales_customers (name, category, address, phone_number, alternate_phone_number, email, gst) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [name, category, address, phone_number, alternate_phone_number, email, gst]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error creating customer' });
    }
});

// Update customer
router.put('/customers/:id', authenticateAdmin, async (req, res) => {
    const { id } = req.params;
    const { name, category, address, phone_number, alternate_phone_number, email, gst } = req.body;
    try {
        const result = await pool.query(
            'UPDATE sales_customers SET name = $1, category = $2, address = $3, phone_number = $4, alternate_phone_number = $5, email = $6, gst = $7 WHERE id = $8 RETURNING *',
            [name, category, address, phone_number, alternate_phone_number, email, gst, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error updating customer' });
    }
});

// Delete customer
router.delete('/customers/:id', authenticateAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM sales_customers WHERE id = $1', [id]);
        res.json({ message: 'Customer deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error deleting customer' });
    }
});

// Update invoice status
router.put('/invoices/:id/status', authenticateAdmin, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        const result = await pool.query(
            'UPDATE sales_invoices SET approval_status = $1 WHERE id = $2 RETURNING *',
            [status, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error updating invoice status' });
    }
});

router.delete('/invoices/:id', authenticateAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM sales_invoices WHERE id = $1', [id]);
        res.json({ message: 'Invoice deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error deleting invoice' });
    }
});

router.get('/invoices/:id/pdf', async (req, res) => {
    const { id } = req.params;
    try {
        const historyRes = await pool.query(`
            SELECT h.*, COALESCE(c.name, h.customer_name_manual) as customer_name, c.category
            FROM sales_history h
            LEFT JOIN sales_customers c ON h.customer_id = c.id
            WHERE h.id = $1
        `, [id]);
        
        const invoice = historyRes.rows[0];
        if (!invoice) return res.status(404).send('Invoice not found');
        
        const itemsRes = await pool.query('SELECT * FROM sales_history_items WHERE sales_history_id = $1', [id]);
        const items = itemsRes.rows;
        
        const doc = new jsPDF();
        
        // Header
        doc.setFontSize(22);
        doc.setTextColor(232, 92, 36); // #e85c24
        doc.text('ADHMANGALAM', 105, 20, { align: 'center' });
        
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text('FACTORY ADMIN DASHBOARD V2.0', 105, 28, { align: 'center' });
        
        // Invoice Info
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text(`Invoice #: INV-${invoice.invoice_number}`, 20, 45);
        doc.text(`Date: ${new Date(invoice.created_at).toLocaleDateString()}`, 20, 52);
        doc.text(`Batch: ${invoice.batch_number}`, 20, 59);
        
        doc.text(`To: ${invoice.customer_name}`, 140, 45);
        doc.text(`Category: ${invoice.category || 'Standard'}`, 140, 52);
        
        // Items Table
        const tableData = items.map(item => [
            item.product_name,
            item.quantity.toString(),
            `Rs. ${item.unit_price}`,
            `Rs. ${item.line_total}`
        ]);
        
        (doc as any).autoTable({
            startY: 70,
            head: [['Product Asset', 'Quantity', 'Unit Price', 'Line Total']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [51, 51, 51] }
        });
        
        const finalY = (doc as any).lastAutoTable.cursor.y + 10;
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`Total Amount: Rs. ${invoice.total_amount}`, 140, finalY);
        
        const pdfOutput = doc.output('arraybuffer');
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.invoice_number}.pdf`);
        res.send(Buffer.from(pdfOutput));
    } catch (err) {
        console.error(err);
        res.status(500).send('Error generating PDF');
    }
});

export default router;
