import { Router } from 'express';
import {
  createOrder, confirmPayment, getMyOrders, getOrderById, getBranchOrders,
  getStaffOrders, assignOrder, updateOrderStatus, getOrderStats,
} from '../controllers/order.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, createOrder);
router.get('/my-orders', authenticate, getMyOrders);
router.get('/staff', authenticate, authorize('staff', 'admin'), getStaffOrders);
router.get('/stats', authenticate, authorize('superadmin', 'admin'), getOrderStats);
router.get('/branch/:branchId?', authenticate, authorize('superadmin', 'admin'), getBranchOrders);
router.get('/:id', authenticate, getOrderById);
router.post('/:id/confirm-payment', authenticate, confirmPayment);
router.post('/:id/assign', authenticate, authorize('admin', 'superadmin'), assignOrder);
router.put('/:id/status', authenticate, authorize('admin', 'staff', 'superadmin'), updateOrderStatus);

export default router;
