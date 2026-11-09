import { z } from 'zod';

const id = z.string().regex(/^[a-f\d]{24}$/i);
export const createReviewSchema = z.object({
  body: z.object({ productId: id, orderId: id, rating: z.number().int().min(1).max(5), description: z.string().trim().min(5).max(1500) }).strict(),
});
export const moderateReviewSchema = z.object({
  params: z.object({ reviewId: id }),
  body: z.object({ status: z.enum(['approved', 'rejected']) }).strict(),
});
