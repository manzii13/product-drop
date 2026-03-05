import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export const errorHandler = (err: unknown, req: Request, res: Response, _next: NextFunction): void => {
    console.error(`[ERROR] ${req.method} ${req.path}:`, err);

    if (err instanceof ZodError) {
        res.status(400).json({ success: false, message: 'Validation error', errors: err.issues });
        return;
    }

    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2002') {
            res.status(409).json({ success: false, message: 'Duplicate entry' });
            return;
        }
    }

    const message = err instanceof Error ? err.message : 'Internal server error';
    res.status(500).json({ success: false, message });
};