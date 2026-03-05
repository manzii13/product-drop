import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';
import { registerSchema, loginSchema } from '../validators/schemas';

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const data = registerSchema.parse(req.body);
        const hashed = await bcrypt.hash(data.password, 10);
        const user = await prisma.user.create({
            data: { ...data, password: hashed },
            select: { id: true, email: true, name: true, createdAt: true },
        });
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: '24h' });
        res.status(201).json({ success: true, data: { user, token } });
    } catch (err) {
        next(err);
    }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const data = loginSchema.parse(req.body);
        const user = await prisma.user.findUnique({ where: { email: data.email } });
        if (!user || !(await bcrypt.compare(data.password, user.password))) {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
            return;
        }
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: '24h' });
        res.json({ success: true, data: { user: { id: user.id, email: user.email, name: user.name }, token } });
    } catch (err) {
        next(err);
    }
};