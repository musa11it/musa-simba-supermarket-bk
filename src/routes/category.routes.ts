import { Router } from 'express';
import {
  getAllCategories, getCategoryById, createCategory, updateCategory, deleteCategory,
} from '../controllers/category.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', getAllCategories);
router.get('/:id', getCategoryById);
router.post('/', authenticate, authorize('superadmin', 'admin'), createCategory);
router.put('/:id', authenticate, authorize('superadmin', 'admin'), updateCategory);
router.delete('/:id', authenticate, authorize('superadmin'), deleteCategory);

export default router;
