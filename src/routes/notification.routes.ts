import { Router } from 'express';
import {
  getMyNotifications, markAsRead, markAllRead, getUnreadCount,
} from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getMyNotifications);
router.get('/unread-count', authenticate, getUnreadCount);
router.put('/:id/read', authenticate, markAsRead);
router.put('/mark-all-read', authenticate, markAllRead);

export default router;
