import { Router } from 'express';
import {
  getAllBranches, getBranchById, createBranch, updateBranch, deleteBranch,
  approveBranch, rejectBranch, getPendingBranches, assignManager,
} from '../controllers/branch.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', getAllBranches);
router.get('/pending', authenticate, authorize('superadmin'), getPendingBranches);
router.get('/:id', getBranchById);
router.post('/', authenticate, authorize('superadmin', 'admin'), createBranch);
router.put('/:id', authenticate, authorize('superadmin', 'admin'), updateBranch);
router.delete('/:id', authenticate, authorize('superadmin'), deleteBranch);
router.post('/:id/approve', authenticate, authorize('superadmin'), approveBranch);
router.post('/:id/reject', authenticate, authorize('superadmin'), rejectBranch);
router.post('/:id/assign-manager', authenticate, authorize('superadmin'), assignManager);

export default router;
