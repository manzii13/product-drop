export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    currentStock: number;
    totalStock: number;
    imageUrl?: string;
}

export interface Reservation {
    id: string;
    productId: string;
    quantity: number;
    status: 'PENDING' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED';
    expiresAt: string;
    product: { name: string; price: number; imageUrl?: string };
}

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}