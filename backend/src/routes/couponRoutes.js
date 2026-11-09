import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { requireDatabase } from '../middleware/requireDatabase.js';
import { validate } from '../middleware/validate.js';
import { createCouponSchema, couponStatusSchema } from '../validators/commerceValidators.js';
import { createCoupon, listCoupons, setCouponActive, validateCoupon } from '../controllers/couponController.js';

const router = Router();
router.get('/validate', requireDatabase, authenticate, authorize('customer'), validateCoupon);
router.use(requireDatabase, authenticate, authorize('admin'));
router.get('/admin', listCoupons);
router.post('/admin', validate(createCouponSchema), createCoupon);
router.patch('/admin/:couponId/status', validate(couponStatusSchema), setCouponActive);
export default router;
