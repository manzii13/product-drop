import client from './client';
import type { Reservation, ApiResponse } from '../types';

export const createReservation = async (productId: string, quantity: number): Promise<Reservation> => {
    const res = await client.post<ApiResponse<Reservation>>('/reserve', { productId, quantity });
    return res.data.data;
};

export const checkout = async (reservationId: string) => {
    const res = await client.post('/checkout', { reservationId });
    return res.data;
};