import { Router } from 'express';
import { createReview, getBranchReviews } from '../controllers/review.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, createReview);
router.get('/branch/:branchId', getBranchReviews);

export default router;
