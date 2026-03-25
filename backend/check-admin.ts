import pool from './src/config/db';
import bcrypt from 'bcryptjs';

async function checkUser() {
    try {
        const result = await pool.query("SELECT * FROM users WHERE LOWER(username) = 'admin'");
        if (result.rows.length === 0) {
            console.log('User "admin" not found.');
        } else {
            const user = result.rows[0];
            console.log('User found:', { username: user.username, role: user.role });
            const isMatch = await bcrypt.compare('admin123', user.password);
            console.log('Password "admin123" matches:', isMatch);
            console.log('Stored password hash starts with:', user.password.substring(0, 10));
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkUser();
