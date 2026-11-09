import { Review } from '../models/Review.js';
import { createReview, getProductReviews, moderateReview } from '../services/reviewService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const productReviews = asyncHandler(async (req, res) => {
  res.json({ reviews: await getProductReviews(req.params.productId) });
});
export const submitReview = asyncHandler(async (req, res) => {
  const review = await createReview({ customerId: req.user._id, ...req.body });
  res.status(201).json({ review });
});
export const myReviews = asyncHandler(async (req, res) => {
  res.json({ reviews: await Review.find({ customer: req.user._id }).populate('product', 'name slug').sort({ createdAt: -1 }).lean() });
});
export const reviewQueue = asyncHandler(async (req, res) => {
  res.json({ reviews: await Review.find().populate('customer', 'name email').populate('product', 'name').sort({ createdAt: -1 }).limit(200).lean() });
});
export const moderate = asyncHandler(async (req, res) => {
  res.json({ review: await moderateReview(req.params.reviewId, req.body.status) });
});
