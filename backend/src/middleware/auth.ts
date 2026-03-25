import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
if (JWT_SECRET === 'fallback_secret') {
    console.warn('[AUTH] Warning: Using fallback_secret in middleware');
}

export interface AuthRequest extends Request {
    user?: any;
}

export const authenticateAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Forbidden: Admin access only' });
        }
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid token' });
    }
};
