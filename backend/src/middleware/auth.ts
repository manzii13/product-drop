import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../types';

export const authenticate = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): void => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
        res.status(401).json({ success: false, message: 'No token provided' });
        return;
    }
    try {
        const decoded = jwt.verify(
            token,
            process.env['JWT_SECRET'] || 'secret'
        ) as { userId: string };
        req.userId = decoded.userId;
        next();
    } catch {
        res.status(401).json({ success: false, message: 'Invalid token' });
    }
};