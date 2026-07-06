import { Router, Request, Response } from 'express';
import { NotificationService } from './notification.service';
import { authenticate, authorize } from '../../common/guards/auth.guard';
import { sendSuccess, sendError } from '../../common/helpers';

const router = Router();
const notificationService = new NotificationService();

// GET /api/notifications - Admin: list notifications
router.get('/', authenticate, authorize('admin'), async (req: Request, res: Response) => {
  const { page, limit, unread_only } = req.query;

  try {
    const result = await notificationService.findAll({
      unread_only: unread_only === 'true',
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
    });
    return sendSuccess(res, result.notifications, undefined, 200, result.pagination);
  } catch (error) {
    return sendError(res, (error as Error).message, 500);
  }
});

// GET /api/notifications/unread-count - Admin: badge counter
router.get('/unread-count', authenticate, authorize('admin'), async (_req: Request, res: Response) => {
  try {
    const count = await notificationService.unreadCount();
    return sendSuccess(res, { count });
  } catch (error) {
    return sendError(res, (error as Error).message, 500);
  }
});

// PATCH /api/notifications/read-all - Admin: mark all as read
router.patch('/read-all', authenticate, authorize('admin'), async (_req: Request, res: Response) => {
  try {
    const updated = await notificationService.markAllRead();
    return sendSuccess(res, { updated });
  } catch (error) {
    return sendError(res, (error as Error).message, 500);
  }
});

// PATCH /api/notifications/:id/read - Admin: mark one as read
router.patch('/:id/read', authenticate, authorize('admin'), async (req: Request, res: Response) => {
  try {
    const notification = await notificationService.markRead(req.params.id);
    return sendSuccess(res, notification);
  } catch (error) {
    return sendError(res, (error as Error).message, 404);
  }
});

export default router;
