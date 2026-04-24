import { Router } from 'express';
import {
  getBranchInventory, updateStock, markOutOfStock, getLowStockAlerts,
} from '../controllers/inventory.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/branch/:branchId?', authenticate, authorize('admin', 'staff', 'superadmin'), getBranchInventory);
router.get('/low-stock', authenticate, authorize('admin', 'staff', 'superadmin'), getLowStockAlerts);
router.put('/stock', authenticate, authorize('admin', 'staff', 'superadmin'), updateStock);
router.put('/:id/out-of-stock', authenticate, authorize('admin', 'staff', 'superadmin'), markOutOfStock);

export default router;
