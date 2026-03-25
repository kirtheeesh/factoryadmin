import express from 'express';
import pool from '../config/db';
import { authenticateAdmin } from '../middleware/auth';

const router = express.Router();

router.get('/', authenticateAdmin, async (req, res) => {
    try {
        const { machine_id, from, to, status } = req.query;
        let query = 'SELECT * FROM production_logs';
        const params: any[] = [];
        
        const conditions: string[] = [];
        
        if (machine_id) {
            params.push(machine_id);
            conditions.push(`machine_id = $${params.length}`);
        }
        if (from) {
            params.push(from);
            conditions.push(`created_at >= $${params.length}`);
        }
        if (to) {
            params.push(to);
            conditions.push(`created_at <= $${params.length}`);
        }
        if (status) {
            params.push(status);
            conditions.push(`approval_status = $${params.length}`);
        }
        
        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }
        
        query += ' ORDER BY log_id DESC';
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching production logs' });
    }
});

router.put('/:id/status', authenticateAdmin, async (req, res) => {
    const { id } = req.params;
    const { status, operator_name, rejection_reason } = req.body;
    try {
        const result = await pool.query(
            'UPDATE production_logs SET approval_status = $1, operator_name = $2, rejection_reason = $3 WHERE log_id = $4 RETURNING *',
            [status, operator_name || null, rejection_reason || null, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error updating production log status' });
    }
});

export default router;
