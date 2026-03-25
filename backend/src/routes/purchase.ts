import express from 'express';
import pool from '../config/db';
import { authenticateAdmin } from '../middleware/auth';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const router = express.Router();

// Helper function to update inventory stock
async function updateInventoryStock(client: any, category: string, materialId: number, quantity: number) {
    const qty = parseFloat(quantity.toString());
    const cat = category || 'Materials';
    console.log(`[INVENTORY-UPDATE] Category: ${cat}, ID: ${materialId}, Qty: ${qty}`);

    if (cat === 'Materials') {
        await client.query(
            "UPDATE inventory_materials SET closing_stock = COALESCE(closing_stock, 0) + $1 WHERE id = $2",
            [qty, materialId]
        );
    } else if (cat === 'Colors') {
        await client.query(
            "UPDATE inventory_colors SET stock_qty_kgs = COALESCE(stock_qty_kgs, 0) + $1 WHERE id = $2",
            [qty, materialId]
        );
    } else if (cat === 'Molds') {
        await client.query(
            "UPDATE inventory_molds SET stock_count = COALESCE(stock_count, 0) + $1 WHERE id = $2",
            [Math.round(qty), materialId]
        );
    } else if (cat === 'Packing') {
        await client.query(
            "UPDATE inventory_packing SET stock_qty_pcs = COALESCE(stock_qty_pcs, 0) + $1 WHERE id = $2",
            [Math.round(qty), materialId]
        );
    } else if (cat === 'Products' || cat === 'Product') {
        await client.query(
            "UPDATE inventory_product SET closing_stock = COALESCE(closing_stock, 0) + $1 WHERE id = $2",
            [qty, materialId]
        );
    }
}

// Get all purchase requests
router.get('/requests', authenticateAdmin, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM purchase_requests ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Approve a purchase request
router.patch('/requests/:id/approve', authenticateAdmin, async (req, res) => {
    const { id } = req.params;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // 1. Update purchase request status
        const requestResult = await client.query(
            "UPDATE purchase_requests SET status = 'APPROVED_BY_ADMIN', inventory_synced = TRUE WHERE id = $1 RETURNING *",
            [id]
        );
        
        if (requestResult.rows.length === 0) {
            throw new Error('Purchase request not found');
        }
        
        const request = requestResult.rows[0];
        
        // 2. Create a purchase order record so it shows up in Admin/Accounts History
        await client.query(
            `INSERT INTO purchase_orders (
                request_id, material_id, material_name, category, requested_quantity, 
                purchased_quantity, vendor_name, price, created_by, 
                status, admin_approval_date
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'APPROVED_BY_ADMIN', NOW())`,
            [
                request.id, 
                request.material_id, 
                request.material_name,
                request.category || 'Materials',
                request.requested_quantity, 
                request.requested_quantity, 
                request.vendor_name, 
                request.total_price || (request.vendor_price * request.requested_quantity),
                request.requested_by
            ]
        );

        // 3. Update inventory stock immediately upon request approval
        await updateInventoryStock(client, request.category, request.material_id, request.requested_quantity);
        
        await client.query('COMMIT');
        res.json(request);
    } catch (err: any) {
        await client.query('ROLLBACK');
        console.error("Approve Request Error:", err.message);
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// Update a purchase request (vendor details)
router.patch('/requests/:id', authenticateAdmin, async (req, res) => {
    const { id } = req.params;
    const { vendor_name, vendor_price, requested_quantity } = req.body;
    try {
        const result = await pool.query(
            "UPDATE purchase_requests SET vendor_name = $1, vendor_price = $2, requested_quantity = $3 WHERE id = $4 RETURNING *",
            [vendor_name, vendor_price, requested_quantity, id]
        );
        res.json(result.rows[0]);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Get all pending purchase orders (from Accounts)
router.get('/orders/pending', authenticateAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM purchase_orders WHERE status = 'PENDING_ADMIN_PURCHASE_APPROVAL' ORDER BY created_at DESC"
        );
        res.json(result.rows);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Approve a purchase order
router.patch('/orders/:id/approve', authenticateAdmin, async (req, res) => {
    const { id } = req.params;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const result = await client.query(
            "UPDATE purchase_orders SET status = 'APPROVED_BY_ADMIN', admin_approval_date = NOW() WHERE id = $1 RETURNING *",
            [id]
        );
        
        if (result.rows.length === 0) {
            throw new Error('Purchase order not found');
        }
        
        const po = result.rows[0];
        
        // Update inventory stock using helper
        await updateInventoryStock(client, po.category, po.material_id, po.purchased_quantity);

        await client.query('COMMIT');
        res.json(po);
    } catch (err: any) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// Get purchase history
router.get('/history', authenticateAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM purchase_orders WHERE status IN ('APPROVED_BY_ADMIN', 'COMPLETED') ORDER BY COALESCE(admin_approval_date, created_at) DESC"
        );
        res.json(result.rows);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/orders/:id/pdf', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM purchase_orders WHERE id = $1', [id]);
        const po = result.rows[0];
        
        if (!po) return res.status(404).send('Purchase Order not found');
        
        const doc = new jsPDF();
        
        // Header
        doc.setFontSize(22);
        doc.setTextColor(232, 92, 36); // #e85c24
        doc.text('ADHMANGALAM', 105, 20, { align: 'center' });
        
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text('FACTORY ADMIN DASHBOARD V2.0', 105, 28, { align: 'center' });
        
        doc.setFontSize(16);
        doc.setTextColor(0);
        doc.text('PURCHASE ORDER', 105, 45, { align: 'center' });
        
        // PO Info
        doc.setFontSize(11);
        doc.text(`PO Number: PO-${po.id.toString().padStart(5, '0')}`, 20, 60);
        doc.text(`Date: ${new Date(po.created_at).toLocaleDateString()}`, 20, 67);
        doc.text(`Vendor: ${po.vendor_name}`, 20, 74);
        
        doc.text(`Status: ${po.status.replace(/_/g, ' ')}`, 140, 60);
        doc.text(`Approved: ${po.admin_approval_date ? new Date(po.admin_approval_date).toLocaleDateString() : 'Pending'}`, 140, 67);
        
        // Table
        const tableData = [[
            po.material_name,
            po.category || 'Materials',
            po.purchased_quantity.toString(),
            `Rs. ${po.price}`
        ]];
        
        (doc as any).autoTable({
            startY: 85,
            head: [['Material Asset', 'Category', 'Quantity', 'Amount']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [51, 51, 51] }
        });
        
        const pdfOutput = doc.output('arraybuffer');
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=purchase-order-${po.id}.pdf`);
        res.send(Buffer.from(pdfOutput));
    } catch (err) {
        console.error(err);
        res.status(500).send('Error generating PDF');
    }
});

export default router;
