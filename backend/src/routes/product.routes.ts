import { Router } from 'express';
import { getProducts, getProduct, createProduct, updateProduct } from '../controllers/product.controller';
const router = Router();
router.get('/', getProducts);
router.get('/:id', getProduct);
router.post('/', createProduct);
router.put('/:id', updateProduct);
export default router;