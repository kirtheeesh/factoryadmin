import express from 'express';
import pool from '../config/db';

const router = express.Router();

// @route   GET /api/db-test
// @desc    Test Database Connection
// @access  Public
router.get('/', async (req, res) => {
    try {
        const startTime = Date.now();
        
        // Query to get DB name, table count, and current time
        const query = `
            SELECT 
                current_database() as db_name,
                (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public')::int as table_count,
                NOW() as current_time
        `;
        
        const result = await pool.query(query);
        const duration = Date.now() - startTime;
        
        const { db_name, table_count, current_time } = result.rows[0];
        
        res.status(200).json({
            status: '✅ Connected',
            database: {
                name: db_name,
                tables_found: table_count,
                connection_type: 'PostgreSQL'
            },
            server: {
                time: current_time,
                latency: `${duration}ms`,
                environment: process.env.NODE_ENV || 'development'
            },
            message: `Successfully connected to database "${db_name}" with ${table_count} tables.`
        });
    } catch (err: any) {
        console.error('❌ Database connection test failed:', err.message);
        res.status(500).json({
            success: false,
            error: err.message || 'Database connection error',
            hint: 'Check your VPS firewall and pg_hba.conf'
        });
    }
});

export default router;
