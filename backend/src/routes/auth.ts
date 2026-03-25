import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

router.post('/login', async (req, res) => {
    console.log('--- LOGIN ATTEMPT ---');
    console.log('Body:', JSON.stringify(req.body));
    const { username, password } = req.body;
    
    if (!username || !password) {
        console.log('Missing username or password');
        return res.status(400).json({ message: 'Username and password are required' });
    }

    const cleanUsername = username.trim();
    const cleanPassword = password.trim();

    try {
        const result = await pool.query('SELECT * FROM users WHERE LOWER(username) = LOWER($1)', [cleanUsername]);
        console.log(`Searching for: [${cleanUsername}] -> Found: ${result.rows.length} records`);
        
        if (result.rows.length === 0) {
            console.log('User not found in database');
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = result.rows[0];
        console.log(`Comparing password for user: ${user.username} (Role: ${user.role})`);
        const isMatch = await bcrypt.compare(cleanPassword, user.password);
        console.log(`Password comparison result: ${isMatch}`);

        if (!isMatch) {
            console.log('Password does not match');
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        if (user.role !== 'ADMIN') {
            console.log(`User has role [${user.role}], expected [ADMIN]`);
            return res.status(403).json({ message: 'Access denied: Not an admin' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
