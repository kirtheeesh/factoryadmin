import express from 'express';
import pool from '../config/db';
import { authenticateAdmin } from '../middleware/auth';
import bcrypt from 'bcryptjs';

const router = express.Router();

router.get('/', authenticateAdmin, async (req, res) => {
    try {
        const { role, search } = req.query;
        let query = 'SELECT id, username, role FROM users';
        const params: any[] = [];
        
        if (role || search) {
            query += ' WHERE ';
            if (role) {
                params.push(role);
                query += `role = $${params.length}`;
            }
            if (search) {
                if (role) query += ' AND ';
                params.push(`%${search}%`);
                query += `LOWER(username) LIKE LOWER($${params.length})`;
            }
        }
        
        query += ' ORDER BY id DESC';
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching users' });
    }
});

router.post('/', authenticateAdmin, async (req, res) => {
    const { username, password, role } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING id, username, role',
            [username, hashedPassword, role]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error creating user' });
    }
});

router.put('/:id', authenticateAdmin, async (req, res) => {
    const { id } = req.params;
    const { username, password, role } = req.body;
    try {
        let query = 'UPDATE users SET username = $1, role = $2';
        const params = [username, role];
        
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            params.push(hashedPassword);
            query += `, password = $${params.length}`;
        }
        
        params.push(id);
        query += ` WHERE id = $${params.length} RETURNING id, username, role`;
        
        const result = await pool.query(query, params);
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error updating user' });
    }
});

router.delete('/:id', authenticateAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM users WHERE id = $1', [id]);
        res.json({ message: 'User deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error deleting user' });
    }
});

export default router;
