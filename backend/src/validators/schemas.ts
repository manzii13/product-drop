import { z } from 'zod';

export const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(1),
});

export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

export const reserveSchema = z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().positive().max(10),
});

export const checkoutSchema = z.object({
    reservationId: z.string().uuid(),
});

export const paginationSchema = z.object({
    page: z.string().optional().default('1'),
    limit: z.string().optional().default('10'),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
    status: z.string().optional(),
});