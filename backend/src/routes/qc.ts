import express from 'express';
import pool from '../config/db';
import { authenticateAdmin } from '../middleware/auth';

const router = express.Router();

router.get('/', authenticateAdmin, async (req, res) => {
    try {
        const { from, to, machine_id } = req.query;
        let query = 'SELECT * FROM qc_logs';
        const params: any[] = [];
        
        const conditions: string[] = [];
        if (from) {
            params.push(from);
            conditions.push(`timestamp >= $${params.length}`);
        }
        if (to) {
            params.push(to);
            conditions.push(`timestamp <= $${params.length}`);
        }
        if (machine_id) {
            params.push(machine_id);
            conditions.push(`machine_id = $${params.length}`);
        }
        
        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }
        
        query += ' ORDER BY id DESC';
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching QC logs' });
    }
});

router.post('/', authenticateAdmin, async (req, res) => {
    const { machine_id, last_hour_production, average_weight, rejection_pcs, remarks, qa_staff } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO qc_logs (machine_id, last_hour_production, average_weight, rejection_pcs, remarks, qa_staff) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [machine_id, last_hour_production, average_weight, rejection_pcs, remarks, qa_staff]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error creating QC log' });
    }
});

router.delete('/:id', authenticateAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM qc_logs WHERE id = $1', [id]);
        res.json({ message: 'QC log deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error deleting QC log' });
    }
});

export default router;
