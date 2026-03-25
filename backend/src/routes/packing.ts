import express from 'express';
import pool from '../config/db';
import { authenticateAdmin } from '../middleware/auth';

const router = express.Router();

// Get all dispatch records
router.get('/dispatch', authenticateAdmin, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT d.*, u.username as dispatched_by_name 
            FROM dispatch d
            LEFT JOIN users u ON d.dispatched_by = u.id
            ORDER BY d.dispatched_at DESC
        `);
        
        // Fetch items for each dispatch
        for (let row of result.rows) {
            const itemsRes = await pool.query('SELECT product_name, quantity FROM dispatch_item WHERE dispatch_id = $1', [row.id]);
            row.items_summary = itemsRes.rows.map((i: any) => `${i.product_name} (${i.quantity})`).join(', ');
        }
        
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching dispatch history:', err);
        res.status(500).json({ message: 'Error fetching dispatch history' });
    }
});

export default router;
