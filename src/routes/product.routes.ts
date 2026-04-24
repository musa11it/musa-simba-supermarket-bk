import { Router } from 'express';
import {
  getAllProducts, getProductById, createProduct, updateProduct, deleteProduct,
  getFeaturedProducts, getProductsByCategory,
} from '../controllers/product.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', getAllProducts);
router.get('/featured', getFeaturedProducts);
router.get('/category/:slug', getProductsByCategory);
router.get('/:id', getProductById);
router.post('/', authenticate, authorize('superadmin', 'admin'), createProduct);
router.put('/:id', authenticate, authorize('superadmin', 'admin'), updateProduct);
router.delete('/:id', authenticate, authorize('superadmin', 'admin'), deleteProduct);

export default router;
