import express from 'express';
import pool from '../config/db';
import { authenticateAdmin } from '../middleware/auth';

const router = express.Router();

router.get('/', authenticateAdmin, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM machine_status ORDER BY id ASC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching machines' });
    }
});

router.put('/:id', authenticateAdmin, async (req, res) => {
    const { id } = req.params;
    const { machine_name, status, cycle_timing, cavity } = req.body;
    try {
        const result = await pool.query(
            'UPDATE machine_status SET machine_name = $1, status = $2, cycle_timing = $3, cavity = $4 WHERE id = $5 RETURNING *',
            [machine_name, status, cycle_timing, cavity, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error updating machine' });
    }
});

router.post('/', authenticateAdmin, async (req, res) => {
    const { machine_name, status, cycle_timing, cavity } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO machine_status (machine_name, status, cycle_timing, cavity) VALUES ($1, $2, $3, $4) RETURNING *',
            [machine_name, status || 'idle', cycle_timing || 0, cavity || 1]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error creating machine' });
    }
});

router.delete('/:id', authenticateAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM machine_status WHERE id = $1', [id]);
        res.json({ message: 'Machine deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error deleting machine' });
    }
});

export default router;
