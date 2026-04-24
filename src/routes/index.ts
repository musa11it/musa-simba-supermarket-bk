import { Router } from 'express';
import authRoutes from './auth.routes';
import branchRoutes from './branch.routes';
import productRoutes from './product.routes';
import categoryRoutes from './category.routes';
import orderRoutes from './order.routes';
import inventoryRoutes from './inventory.routes';
import reviewRoutes from './review.routes';
import userRoutes from './user.routes';
import notificationRoutes from './notification.routes';
import aiRoutes from './ai.routes';

const router = Router();

router.get('/', (_req, res) => {
  res.json({
    success: true,
    message: '🛒 Simba Supermarket API v2.0',
    endpoints: {
      auth: '/api/auth',
      branches: '/api/branches',
      products: '/api/products',
      categories: '/api/categories',
      orders: '/api/orders',
      inventory: '/api/inventory',
      reviews: '/api/reviews',
      users: '/api/users',
      notifications: '/api/notifications',
      ai: '/api/ai',
    },
  });
});

router.use('/auth', authRoutes);
router.use('/branches', branchRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/orders', orderRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/reviews', reviewRoutes);
router.use('/users', userRoutes);
router.use('/notifications', notificationRoutes);
router.use('/ai', aiRoutes);

export default router;
