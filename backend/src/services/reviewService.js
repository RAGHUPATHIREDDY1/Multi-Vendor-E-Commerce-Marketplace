import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { Review } from '../models/Review.js';
import { VendorOrder } from '../models/VendorOrder.js';
import { AppError } from '../utils/AppError.js';

export async function createReview({ customerId, productId, orderId, rating, description }) {
  const [order, product] = await Promise.all([
    Order.findOne({ _id: orderId, customer: customerId, paymentStatus: 'PAID' }),
    Product.findById(productId),
  ]);
  if (!order || order.status === 'CANCELLED') throw new AppError('A verified purchase is required to review this item.', 403);
  const vendorOrder = await VendorOrder.findOne({
    order: order._id,
    status: 'DELIVERED',
    'items.product': productId,
  });
  if (!vendorOrder) throw new AppError('A delivered verified purchase is required to review this item.', 403);

  const review = await Review.create({ customer: customerId, product: productId, order: orderId, rating, description, verifiedPurchase: true, status: 'pending' });
  const approved = await Review.find({ product: product._id, status: 'approved' }).select('rating').lean();
  product.rating = approved.length ? Math.round((approved.reduce((sum, item) => sum + item.rating, 0) / approved.length) * 10) / 10 : 0;
  await product.save();
  return review;
}

export async function getProductReviews(productId) {
  return Review.find({ product: productId, status: 'approved' }).populate('customer', 'name').sort({ createdAt: -1 }).lean();
}

export async function moderateReview(reviewId, status) {
  const review = await Review.findByIdAndUpdate(reviewId, { status }, { new: true });
  if (!review) throw new AppError('Review was not found.', 404);
  const approved = await Review.find({ product: review.product, status: 'approved' }).select('rating').lean();
  await Product.updateOne(
    { _id: review.product },
    { $set: { rating: approved.length ? Math.round((approved.reduce((sum, item) => sum + item.rating, 0) / approved.length) * 10) / 10 : 0 } },
  );
  return review;
}
