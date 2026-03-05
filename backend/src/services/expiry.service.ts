import prisma from '../prisma';
import { ReservationStatus } from '@prisma/client';

export class ExpiryService {
    static async expireReservations(): Promise<number> {
        const now = new Date();

        const expired = await prisma.reservation.findMany({
            where: {
                status: ReservationStatus.PENDING,
                expiresAt: { lt: now }
            },
            include: { product: true },
        });

        if (!expired.length) return 0;

        await prisma.$transaction(async (tx) => {
            for (const res of expired) {
                await tx.reservation.update({
                    where: { id: res.id },
                    data: { status: ReservationStatus.EXPIRED },
                });
                await tx.product.update({
                    where: { id: res.productId },
                    data: { currentStock: { increment: res.quantity } },
                });
                await tx.inventoryLog.create({
                    data: {
                        productId: res.productId,
                        change: res.quantity,
                        reason: 'RESERVATION_EXPIRED',
                        stockBefore: res.product.currentStock,
                        stockAfter: res.product.currentStock + res.quantity,
                    },
                });
            }
        });

        return expired.length;
    }
}