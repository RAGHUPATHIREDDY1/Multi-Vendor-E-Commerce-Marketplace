import { Coupon } from '../models/Coupon.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';

export const createCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.create({
    ...req.body,
    code: req.body.code.toUpperCase(),
    expiresAt: new Date(req.body.expiresAt),
  });
  res.status(201).json({ coupon });
});

export const listCoupons = asyncHandler(async (req, res) => {
  res.json({ coupons: await Coupon.find().sort({ createdAt: -1 }).lean() });
});

export const setCouponActive = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndUpdate(req.params.couponId, { isActive: req.body.isActive }, { new: true });
  if (!coupon) throw new AppError('Coupon was not found.', 404);
  res.json({ coupon });
});

export const validateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findOne({ code: req.query.code?.trim().toUpperCase(), isActive: true });
  if (!coupon || coupon.expiresAt <= new Date() || (coupon.usageLimit !== undefined && coupon.usageCount >= coupon.usageLimit)) {
    throw new AppError('That coupon is not available.', 404);
  }
  res.json({ coupon: { code: coupon.code, discountType: coupon.discountType, discountValue: coupon.discountValue, minimumOrderMinor: coupon.minimumOrderMinor } });
});
