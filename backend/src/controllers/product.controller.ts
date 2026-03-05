import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';
import { paginationSchema } from '../validators/schemas';

export const getProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { page, limit, sortBy, sortOrder } = paginationSchema.parse(req.query);
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);
        const orderBy = sortBy ? { [sortBy]: sortOrder } : { createdAt: sortOrder as 'asc' | 'desc' };

        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where: { isActive: true },
                skip, take, orderBy,
                select: { id: true, name: true, description: true, price: true, currentStock: true, totalStock: true, imageUrl: true },
            }),
            prisma.product.count({ where: { isActive: true } }),
        ]);

        res.json({ success: true, data: products, meta: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / take) } });
    } catch (err) { next(err); }
};

export const getProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const product = await prisma.product.findUnique({
            where: { id: req.params['id'] as string },
            select: { id: true, name: true, description: true, price: true, currentStock: true, totalStock: true, imageUrl: true },
        });
        if (!product) { res.status(404).json({ success: false, message: 'Product not found' }); return; }
        res.json({ success: true, data: product });
    } catch (err) { next(err); }
};

export const createProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { name, description, price, stock, imageUrl } = req.body;
        const product = await prisma.product.create({
            data: { name, description, price, totalStock: stock, currentStock: stock, imageUrl },
        });
        res.status(201).json({ success: true, data: product });
    } catch (err) { next(err); }


};

export const updateProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const product = await prisma.product.update({
            where: { id: req.params['id'] as string },
            data: req.body,
        });
        res.json({ success: true, data: product });
    } catch (err) { next(err); }
};