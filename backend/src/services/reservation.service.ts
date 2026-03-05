import prisma from '../prisma';
import { ReservationStatus } from '@prisma/client';

export class ReservationService {
    static async createReservation(userId: string, productId: string, quantity: number) {
        // Use a serializable transaction to prevent race conditions
        return await prisma.$transaction(async (tx) => {
            // Lock the product row for update (SELECT FOR UPDATE via raw query)
            const product = await tx.$queryRaw<Array<{
                id: string;
                currentStock: number;
                name: string;
                price: number;
            }>>`
        SELECT id, "currentStock", name, price
        FROM "Product"
        WHERE id = ${productId} AND "isActive" = true
        FOR UPDATE
      `;

            if (!product.length) {
                throw new Error('Product not found or inactive');
            }

            const prod = product[0];

            if (prod.currentStock < quantity) {
                throw new Error(`Insufficient stock. Available: ${prod.currentStock}`);
            }

            // Check for existing active reservation by same user for same product
            const existing = await tx.reservation.findFirst({
                where: {
                    userId,
                    productId,
                    status: ReservationStatus.PENDING,
                    expiresAt: { gt: new Date() },
                },
            });

            if (existing) {
                throw new Error('You already have an active reservation for this product');
            }

            const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

            // Deduct stock
            await tx.product.update({
                where: { id: productId },
                data: { currentStock: { decrement: quantity } },
            });

            // Log inventory change
            await tx.inventoryLog.create({
                data: {
                    productId,
                    change: -quantity,
                    reason: 'RESERVATION',
                    stockBefore: prod.currentStock,
                    stockAfter: prod.currentStock - quantity,
                },
            });

            // Create reservation
            const reservation = await tx.reservation.create({
                data: { userId, productId, quantity, expiresAt, status: ReservationStatus.PENDING },
                include: { product: true },
            });

            return reservation;
        }, {
            isolationLevel: 'Serializable', // Prevents race conditions
        });
    }

    static async checkoutReservation(userId: string, reservationId: string) {
        return await prisma.$transaction(async (tx) => {
            const reservation = await tx.reservation.findFirst({
                where: { id: reservationId, userId },
                include: { product: true },
            });

            if (!reservation) throw new Error('Reservation not found');
            if (reservation.status !== ReservationStatus.PENDING) {
                throw new Error(`Reservation is ${reservation.status}`);
            }
            if (reservation.expiresAt < new Date()) {
                throw new Error('Reservation has expired');
            }

            // Mark reservation completed
            await tx.reservation.update({
                where: { id: reservationId },
                data: { status: ReservationStatus.COMPLETED },
            });

            // Create order
            const order = await tx.order.create({
                data: {
                    userId,
                    reservationId,
                    totalAmount: reservation.product.price * reservation.quantity,
                    status: 'COMPLETED',
                },
                include: { reservation: { include: { product: true } } },
            });

            await tx.inventoryLog.create({
                data: {
                    productId: reservation.productId,
                    change: 0,
                    reason: 'CHECKOUT_COMPLETED',
                    stockBefore: reservation.product.currentStock,
                    stockAfter: reservation.product.currentStock,
                },
            });

            return order;
        });
    }
}