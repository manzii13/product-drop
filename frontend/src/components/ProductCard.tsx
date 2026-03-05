import { useCallback, useState } from 'react';
import { useReservation } from '../hooks/useReservation';
import type { Product } from '../types';
import { CountdownTimer } from './CountDownTimer';

interface Props {
    product: Product;
}

export const ProductCard = ({ product }: Props) => {
    const { reservation, reserveMutation, checkoutMutation } = useReservation();
    const [expired, setExpired] = useState(false);
    const [error, setError] = useState('');

    const myReservation = reservation?.productId === product.id ? reservation : null;
    const isSoldOut = product.currentStock === 0;

    const handleReserve = async () => {
        setError('');
        setExpired(false);

        try {
            await reserveMutation.mutateAsync({ productId: product.id, quantity: 1 });
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            setError(e.response?.data?.message || 'Failed to reserve');
        }
    };

    const handleCheckout = async () => {
        if (!myReservation) return;

        try {
            await checkoutMutation.mutateAsync(myReservation.id);
            alert('Order placed successfully!');
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            setError(e.response?.data?.message || 'Checkout failed');
        }
    };

    const handleExpire = useCallback(() => {
        setExpired(true);
    }, []);

    return (
        <div className="border rounded-xl shadow-md overflow-hidden bg-white max-w-sm">
            {product.imageUrl && (
                <img src={product.imageUrl} alt={product.name} className="w-full h-48 object-cover" />
            )}
            <div className="p-4 space-y-3">
                <h2 className="text-xl font-bold">{product.name}</h2>
                <p className="text-gray-500 text-sm">{product.description}</p>
                <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-green-600">${product.price}</span>
                    <span
                        className={`text-sm font-semibold px-2 py-1 rounded-full ${
                            isSoldOut
                                ? 'bg-red-100 text-red-600'
                                : product.currentStock < 5
                                  ? 'bg-orange-100 text-orange-600'
                                  : 'bg-green-100 text-green-600'
                        }`}
                    >
                        {isSoldOut ? 'Sold Out' : `${product.currentStock} left`}
                    </span>
                </div>

                {myReservation && !expired && (
                    <div className="space-y-2">
                        <CountdownTimer expiresAt={myReservation.expiresAt} onExpire={handleExpire} />
                        <button
                            onClick={handleCheckout}
                            disabled={checkoutMutation.isPending}
                            className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 disabled:opacity-50"
                        >
                            {checkoutMutation.isPending ? 'Processing...' : 'Complete Purchase'}
                        </button>
                    </div>
                )}

                {expired && <p className="text-red-500 text-sm text-center">Your reservation expired. Try again!</p>}

                {!myReservation && !expired && (
                    <button
                        onClick={handleReserve}
                        disabled={isSoldOut || reserveMutation.isPending}
                        className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {reserveMutation.isPending ? 'Reserving...' : isSoldOut ? 'Sold Out' : 'Reserve Now'}
                    </button>
                )}

                {error && <p className="text-red-500 text-xs text-center">{error}</p>}
            </div>
        </div>
    );
};
