import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createReservation, checkout } from '../api/reservations';
import type { Reservation } from '../types';

export const useReservation = () => {
    const queryClient = useQueryClient();
    const [reservation, setReservation] = useState<Reservation | null>(null);

    const reserveMutation = useMutation({
        mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
            createReservation(productId, quantity),
        onSuccess: (data) => {
            setReservation(data);
            queryClient.invalidateQueries({ queryKey: ['products'] });
        },
    });

    const checkoutMutation = useMutation({
        mutationFn: (reservationId: string) => checkout(reservationId),
        onSuccess: () => {
            setReservation(null);
            queryClient.invalidateQueries({ queryKey: ['products'] });
        },
    });

    return { reservation, reserveMutation, checkoutMutation };
};