import client from './client';
import type { Product, ApiResponse } from '../types';

export const fetchProducts = async (): Promise<Product[]> => {
    const res = await client.get<ApiResponse<Product[]>>('/products');
    return res.data.data;
};

export const fetchProduct = async (id: string): Promise<Product> => {
    const res = await client.get<ApiResponse<Product>>(`/products/${id}`);
    return res.data.data;
};