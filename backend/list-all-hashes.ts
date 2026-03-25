import pool from './src/config/db';
import bcrypt from 'bcryptjs';

async function listAll() {
    try {
        const result = await pool.query("SELECT * FROM users");
        for (const user of result.rows) {
            console.log(`User: [${user.username}], Role: [${user.role}]`);
            const m123 = await bcrypt.compare('admin123', user.password);
            const mF123 = await bcrypt.compare('admin@factory.com', user.password);
            console.log(`  - admin123 match: ${m123}`);
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

listAll();
