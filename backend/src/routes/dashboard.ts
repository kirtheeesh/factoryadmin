import express from 'express';
import pool from '../config/db';
import { authenticateAdmin } from '../middleware/auth';

const router = express.Router();

router.get('/stats', authenticateAdmin, async (req, res) => {
    try {
        const { from, to } = req.query;
        const params: any[] = [];
        
        if (from && to) {
            params.push(from, to);
        }

        // 1. Users by role
        const usersByRole = await pool.query('SELECT role, COUNT(*) FROM users GROUP BY role');
        
        // 2. Machines status
        const machineStatus = await pool.query('SELECT status, COUNT(*) FROM machine_status GROUP BY status');
        const totalMachines = await pool.query('SELECT COUNT(*) FROM machine_status');

        // 3. Total production (Filtered)
        const prodQuery = from && to 
            ? `SELECT SUM(total_output) as total FROM production_logs WHERE created_at BETWEEN $1 AND $2`
            : `SELECT SUM(total_output) as total FROM production_logs`;
        const totalProduction = await pool.query(prodQuery, from && to ? [from, to] : []);

        // 4. Total QC (Filtered)
        const qcQuery = from && to 
            ? `SELECT COUNT(*) FROM qc_logs WHERE timestamp BETWEEN $1 AND $2`
            : `SELECT COUNT(*) FROM qc_logs`;
        const totalQC = await pool.query(qcQuery, from && to ? [from, to] : []);

        // 5. Overall Attendance Summary (Most recent status per staff)
        const recentAttendance = await pool.query(`
            SELECT status, COUNT(*) 
            FROM (
                SELECT DISTINCT ON (staff_id) status 
                FROM attendance 
                ORDER BY staff_id, attendance_date DESC
            ) AS latest_attendance
            GROUP BY status
        `);

        // 6. Overall Head Attendance (Recent count)
        const headAttendance = await pool.query(`
            SELECT role, COUNT(*) 
            FROM head_attendance 
            GROUP BY role
        `);

        // 7. Sales summary (Filtered)
        let salesSummary = null;
        try {
            const salesQ = from && to 
                ? `SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total, COUNT(*) FILTER (WHERE approval_status = 'pending') as pending_count FROM sales_history WHERE created_at BETWEEN $1 AND $2`
                : `SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total, COUNT(*) FILTER (WHERE approval_status = 'pending') as pending_count FROM sales_history`;
            const result = await pool.query(salesQ, from && to ? [from, to] : []);
            salesSummary = result.rows[0];
        } catch (e) { }

        // 8. Production Trend (Last 7 days or filtered range)
        const trendQuery = from && to
            ? `SELECT TO_CHAR(created_at, 'DD Mon') as day, SUM(total_output) as output FROM production_logs WHERE created_at BETWEEN $1 AND $2 GROUP BY TO_CHAR(created_at, 'DD Mon'), created_at::date ORDER BY created_at::date ASC`
            : `SELECT TO_CHAR(created_at, 'DD Mon') as day, SUM(total_output) as output FROM production_logs WHERE created_at > CURRENT_DATE - INTERVAL '7 days' GROUP BY TO_CHAR(created_at, 'DD Mon'), created_at::date ORDER BY created_at::date ASC`;
        const productionTrend = await pool.query(trendQuery, from && to ? [from, to] : []);

        // 9. Detailed Material/Product Analytics
        const analyticsParams = from && to ? [from, to] : [];
        const analyticsQuery = `
            WITH 
            prod_stats AS (
                SELECT 
                    product_name as name, 
                    SUM(total_output) as total_production,
                    SUM(CASE WHEN created_at >= date_trunc('month', CURRENT_DATE) THEN total_output ELSE 0 END) as monthly_production
                FROM production_logs
                ${from && to ? 'WHERE created_at BETWEEN $1 AND $2' : ''}
                GROUP BY product_name
            ),
            sales_stats AS (
                SELECT 
                    product_name as name, 
                    SUM(quantity) as total_sales,
                    SUM(CASE WHEN h.created_at >= date_trunc('month', CURRENT_DATE) THEN quantity ELSE 0 END) as monthly_sales,
                    SUM(line_total) as total_sales_amount,
                    SUM(CASE WHEN h.created_at >= date_trunc('month', CURRENT_DATE) THEN line_total ELSE 0 END) as monthly_sales_amount
                FROM sales_history_items i
                JOIN sales_history h ON i.sales_history_id = h.id
                ${from && to ? 'WHERE h.created_at BETWEEN $1 AND $2' : ''}
                GROUP BY product_name
            ),
            purchase_stats AS (
                SELECT 
                    material_name as name, 
                    SUM(purchased_quantity) as total_purchase,
                    SUM(CASE WHEN admin_approval_date >= date_trunc('month', CURRENT_DATE) THEN purchased_quantity ELSE 0 END) as monthly_purchase,
                    SUM(price) as total_purchase_amount,
                    SUM(CASE WHEN admin_approval_date >= date_trunc('month', CURRENT_DATE) THEN price ELSE 0 END) as monthly_purchase_amount
                FROM purchase_orders
                WHERE status = 'APPROVED_BY_ADMIN'
                ${from && to ? 'AND admin_approval_date BETWEEN $1 AND $2' : ''}
                GROUP BY material_name
            ),
            all_names AS (
                SELECT product_name as name FROM inventory_product
                UNION
                SELECT material_name as name FROM inventory_materials
            )
            SELECT 
                an.name,
                COALESCE(ps.total_production, 0) as total_production,
                COALESCE(ps.monthly_production, 0) as monthly_production,
                COALESCE(ss.total_sales, 0) as total_sales,
                COALESCE(ss.monthly_sales, 0) as monthly_sales,
                COALESCE(ss.total_sales_amount, 0) as total_sales_amount,
                COALESCE(ss.monthly_sales_amount, 0) as monthly_sales_amount,
                COALESCE(purs.total_purchase, 0) as total_purchase,
                COALESCE(purs.monthly_purchase, 0) as monthly_purchase,
                COALESCE(purs.total_purchase_amount, 0) as total_purchase_amount,
                COALESCE(purs.monthly_purchase_amount, 0) as monthly_purchase_amount
            FROM all_names an
            LEFT JOIN prod_stats ps ON an.name = ps.name
            LEFT JOIN sales_stats ss ON an.name = ss.name
            LEFT JOIN purchase_stats purs ON an.name = purs.name
            WHERE (ps.total_production > 0 OR ss.total_sales > 0 OR purs.total_purchase > 0)
            ORDER BY an.name ASC
        `;
        const materialAnalytics = await pool.query(analyticsQuery, analyticsParams);

        res.json({
            users: usersByRole.rows,
            machines: machineStatus.rows,
            totalMachines: totalMachines.rows[0].count,
            production: totalProduction.rows[0].total || 0,
            qc: totalQC.rows[0].count,
            attendance: recentAttendance.rows.length > 0 ? recentAttendance.rows : [{status: 'No Data', count: '0'}],
            headAttendance: headAttendance.rows,
            sales: salesSummary,
            productionTrend: productionTrend.rows,
            materialAnalytics: materialAnalytics.rows
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching stats' });
    }
});

export default router;
