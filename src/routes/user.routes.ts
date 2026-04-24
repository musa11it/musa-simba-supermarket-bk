import { Router } from 'express';
import {
  getAllUsers, getUserById, createUser, updateUser, toggleUserStatus, deleteUser,
  getBranchStaff, getDashboardStats,
} from '../controllers/user.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, authorize('superadmin'), getAllUsers);
router.get('/stats', authenticate, authorize('superadmin'), getDashboardStats);
router.get('/branch-staff/:branchId?', authenticate, authorize('admin', 'superadmin'), getBranchStaff);
router.get('/:id', authenticate, authorize('superadmin', 'admin'), getUserById);
router.post('/', authenticate, authorize('superadmin'), createUser);
router.put('/:id', authenticate, authorize('superadmin'), updateUser);
router.put('/:id/toggle-status', authenticate, authorize('superadmin'), toggleUserStatus);
router.delete('/:id', authenticate, authorize('superadmin'), deleteUser);

export default router;
