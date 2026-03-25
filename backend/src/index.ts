import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import pool, { connectDB } from './config/db';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import inventoryRoutes from './routes/inventory';
import machineRoutes from './routes/machines';
import productionRoutes from './routes/production';
import qcRoutes from './routes/qc';
import dashboardRoutes from './routes/dashboard';
import salesRoutes from './routes/sales';
import packingRoutes from './routes/packing';
import purchaseRoutes from './routes/purchase';
import vendorRoutes from './routes/vendors';
import dbTestRoutes from './routes/dbTest';

const app = express();
const PORT = process.env.PORT || 5001;

const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim().replace(/\/$/, ''))
    : [
        'https://adhimangalam.com',
        'http://adhimangalam.com',
        'https://factoryadmin.nexoraapp.in',
        'http://factoryadmin.nexoraapp.in',
        'http://localhost:5173',
        'http://localhost:3000'
    ];

app.use(cors({
    origin: true, // Allow all origins to resolve the login issue immediately
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    credentials: true,
    optionsSuccessStatus: 200
}));

app.use(express.json());

// Log all requests
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

console.log('JWT_SECRET loaded:', process.env.JWT_SECRET ? 'Yes' : 'No');
if (process.env.JWT_SECRET) {
    console.log('JWT_SECRET starts with:', process.env.JWT_SECRET.substring(0, 3));
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/machines', machineRoutes);
app.use('/api/production', productionRoutes);
app.use('/api/qc', qcRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/packing', packingRoutes);
app.use('/api/purchase', purchaseRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/db-test', dbTestRoutes);

app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Admin Backend is running' });
});

// Start DB then Start Server
const startServer = async () => {
    await connectDB();
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Admin Backend running on http://0.0.0.0:${PORT}`);
    });
};

startServer();
