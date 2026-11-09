import { Router } from 'express';
import { getProduct, listProducts } from '../controllers/productController.js';
import { requireDatabase } from '../middleware/requireDatabase.js';
import { validate } from '../middleware/validate.js';
import { productQuerySchema } from '../validators/productValidators.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getProductReviews } from '../services/reviewService.js';
import { z } from 'zod';

const router = Router();

router.get('/', validate(productQuerySchema), requireDatabase, listProducts);
router.get('/:productId/reviews', requireDatabase, validate(z.object({ params: z.object({ productId: z.string().regex(/^[a-f\d]{24}$/i) }) })), asyncHandler(async (req, res) => {
  res.json({ reviews: await getProductReviews(req.params.productId) });
}));
router.get('/:idOrSlug', requireDatabase, getProduct);

export default router;
