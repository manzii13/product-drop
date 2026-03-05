import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { reserveSchema, checkoutSchema, paginationSchema } from '../validators/schemas';
import { ReservationService } from '../services/reservation.service';
import prisma from '../prisma';

export const reserve = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { productId, quantity } = reserveSchema.parse(req.body);
        const reservation = await ReservationService.createReservation(req.userId!, productId, quantity);
        res.status(201).json({ success: true, data: reservation });
    } catch (err) { next(err); }
};

export const checkout = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { reservationId } = checkoutSchema.parse(req.body);
        const order = await ReservationService.checkoutReservation(req.userId!, reservationId);
        res.json({ success: true, data: order });
    } catch (err) { next(err); }
};

export const getMyReservations = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { page, limit, status, sortOrder } = paginationSchema.parse(req.query);
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const where = { userId: req.userId!, ...(status ? { status: status as any } : {}) };

        const [reservations, total] = await Promise.all([
            prisma.reservation.findMany({
                where, skip, take: parseInt(limit),
                orderBy: { createdAt: sortOrder as 'asc' | 'desc' },
                include: { product: { select: { name: true, price: true, imageUrl: true } } },
            }),
            prisma.reservation.count({ where }),
        ]);

        res.json({ success: true, data: reservations, meta: { total, page: parseInt(page), limit: parseInt(limit) } });
    } catch (err) { next(err); }
};