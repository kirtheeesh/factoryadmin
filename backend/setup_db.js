import pkg from 'pg';
const { Pool } = pkg;
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432'),
});

async function setup() {
    const client = await pool.connect();
    try {
        console.log('--- Starting DB Setup ---');

        // 1. Hash admin password
        const hashedPassword = await bcrypt.hash('admin123', 10);

        // 2. Insert admin user if not exists
        const userCheck = await client.query("SELECT * FROM users WHERE username = 'admin'");
        if (userCheck.rows.length === 0) {
            await client.query(
                "INSERT INTO users (username, password, role) VALUES ($1, $2, $3)",
                ['admin', hashedPassword, 'ADMIN']
            );
            console.log('✅ Admin user created.');
        } else {
            // Update password just in case it was not hashed
            await client.query(
                "UPDATE users SET password = $1, role = 'ADMIN' WHERE username = 'admin'",
                [hashedPassword]
            );
            console.log('✅ Admin user updated with hashed password.');
        }

        // 3. Create qc_logs table
        await client.query(`
            CREATE TABLE IF NOT EXISTS qc_logs (
                id SERIAL PRIMARY KEY,
                machine_id INTEGER,
                last_hour_production INTEGER,
                average_weight NUMERIC(10,3),
                rejection_pcs INTEGER DEFAULT 0,
                remarks TEXT,
                timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                qa_staff TEXT
            )
        `);
        console.log('✅ Table qc_logs checked/created.');

        // 4. Ensure sales tables exist
        await client.query(`
            CREATE TABLE IF NOT EXISTS sales_customers (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                category TEXT
            )
        `);
        await client.query(`
            CREATE TABLE IF NOT EXISTS sales_invoices (
                id SERIAL PRIMARY KEY,
                customer_id INTEGER,
                customer_name TEXT,
                category TEXT,
                total_amount NUMERIC(15,2),
                invoice_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        `);
        await client.query(`
            CREATE TABLE IF NOT EXISTS sales_invoice_items (
                id SERIAL PRIMARY KEY,
                invoice_id INTEGER REFERENCES sales_invoices(id) ON DELETE CASCADE,
                product_id INTEGER,
                product_name TEXT,
                quantity INTEGER,
                price_per_unit NUMERIC(15,2),
                line_total NUMERIC(15,2)
            )
        `);
        // 5. Ensure missing dashboard tables exist
        await client.query(`
            CREATE TABLE IF NOT EXISTS production_logs (
                log_id SERIAL PRIMARY KEY,
                machine_id INTEGER,
                product_name TEXT,
                total_output INTEGER,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                approval_status TEXT DEFAULT 'pending',
                operator_name TEXT,
                rejection_reason TEXT
            )
        `);
        
        await client.query(`
            CREATE TABLE IF NOT EXISTS machine_status (
                id SERIAL PRIMARY KEY,
                machine_name TEXT,
                status TEXT DEFAULT 'idle',
                cycle_timing INTEGER DEFAULT 0,
                cavity INTEGER DEFAULT 1
            )
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS attendance (
                id SERIAL PRIMARY KEY,
                staff_id INTEGER,
                status TEXT,
                attendance_date DATE DEFAULT CURRENT_DATE
            )
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS head_attendance (
                id SERIAL PRIMARY KEY,
                role TEXT,
                status TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS sales_history (
                id SERIAL PRIMARY KEY,
                batch_number TEXT,
                invoice_number TEXT,
                sales_request_id INTEGER,
                customer_id INTEGER,
                customer_name_manual TEXT,
                total_amount NUMERIC(15,2),
                status TEXT,
                approved_by TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS purchase_orders (
                id SERIAL PRIMARY KEY,
                request_id INTEGER,
                material_id INTEGER,
                material_name TEXT,
                category TEXT,
                requested_quantity NUMERIC(15,2),
                purchased_quantity NUMERIC(15,2),
                vendor_name TEXT,
                price NUMERIC(15,2),
                created_by TEXT,
                status TEXT,
                admin_approval_date TIMESTAMP WITH TIME ZONE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS inventory_product (
                id SERIAL PRIMARY KEY,
                product_name TEXT,
                opening_stock NUMERIC(15,2) DEFAULT 0,
                closing_stock NUMERIC(15,2) DEFAULT 0,
                minimum_stock_level NUMERIC(15,2) DEFAULT 0,
                unit_weight_gm NUMERIC(15,2) DEFAULT 0,
                vendor_name TEXT,
                vendor_price NUMERIC(15,2)
            )
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS inventory_materials (
                id SERIAL PRIMARY KEY,
                material_name TEXT,
                opening_stock NUMERIC(15,2) DEFAULT 0,
                closing_stock NUMERIC(15,2) DEFAULT 0,
                minimum_stock_level NUMERIC(15,2) DEFAULT 0,
                unit TEXT,
                vendor_name TEXT,
                vendor_price NUMERIC(15,2)
            )
        `);

        console.log('✅ Dashboard tables checked/created.');

        console.log('--- DB Setup Completed ---');
    } catch (err) {
        console.error('❌ Error during setup:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

setup();
