import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { requireDatabase } from '../middleware/requireDatabase.js';
import { validate } from '../middleware/validate.js';
import { confirmPaymentSchema, createPaymentSchema } from '../validators/paymentValidators.js';
import { adminCommissions, adminPayments, confirmPayment, createPayment, myCommissions } from '../controllers/paymentController.js';

const router = Router();
router.use(requireDatabase, authenticate);
router.post('/orders', authorize('customer'), validate(createPaymentSchema), createPayment);
router.post('/verify', authorize('customer'), validate(confirmPaymentSchema), confirmPayment);
router.get('/vendor/commissions', authorize('vendor'), myCommissions);
router.get('/admin/payments', authorize('admin'), adminPayments);
router.get('/admin/commissions', authorize('admin'), adminCommissions);

export default router;
