import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { requireDatabase } from '../middleware/requireDatabase.js';
import { validate } from '../middleware/validate.js';
import { z } from 'zod';
import { listNotifications, markNotificationRead } from '../controllers/notificationController.js';

const router = Router();
router.use(requireDatabase, authenticate);
router.get('/', listNotifications);
router.patch('/:notificationId/read', validate(z.object({ params: z.object({ notificationId: z.string().regex(/^[a-f\d]{24}$/i) }) })), markNotificationRead);
export default router;
