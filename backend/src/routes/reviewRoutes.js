import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { requireDatabase } from '../middleware/requireDatabase.js';
import { validate } from '../middleware/validate.js';
import { createReviewSchema, moderateReviewSchema } from '../validators/reviewValidators.js';
import { moderate, myReviews, reviewQueue, submitReview } from '../controllers/reviewController.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getProductReviews } from '../services/reviewService.js';

const router = Router();
router.get('/products/:productId', requireDatabase, asyncHandler(async (req, res) => {
  res.json({ reviews: await getProductReviews(req.params.productId) });
}));
router.use(requireDatabase, authenticate);
router.post('/', authorize('customer'), validate(createReviewSchema), submitReview);
router.get('/mine', authorize('customer'), myReviews);
router.get('/admin', authorize('admin'), reviewQueue);
router.patch('/admin/:reviewId', authorize('admin'), validate(moderateReviewSchema), moderate);
export default router;
