import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432'),
    // Production Pool Settings
    max: 20, // max number of clients in the pool
    idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
    connectionTimeoutMillis: 5000, // how long to wait before timing out when connecting a new client
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
});

// Pool error handling
pool.on('error', (err) => {
    console.error('Unexpected error on idle database client', err);
    process.exit(-1);
});

export const connectDB = async (retries = 5) => {
    while (retries) {
        try {
            const client = await pool.connect();
            console.log('✅ PostgreSQL Connected successfully');
            client.release();
            break;
        } catch (err) {
            retries -= 1;
            console.error(`❌ Database connection failed. Retries left: ${retries}`);
            console.error(err);
            if (retries === 0) {
                console.error('Final attempt failed. Exiting...');
                process.exit(1);
            }
            // Wait 5 seconds before retrying
            await new Promise(res => setTimeout(res, 5000));
        }
    }
};

export default pool;
