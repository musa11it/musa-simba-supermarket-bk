import { Router } from 'express';
import { chat, search } from '../controllers/ai.controller';
import { optionalAuth } from '../middleware/auth';

const router = Router();

router.post('/chat', optionalAuth, chat);
router.post('/search', optionalAuth, search);

export default router;
