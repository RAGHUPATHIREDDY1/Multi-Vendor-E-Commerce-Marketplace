import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
  discountValue: { type: Number, required: true, min: 0 },
  minimumOrderMinor: { type: Number, default: 0, min: 0 },
  maximumDiscountMinor: { type: Number, min: 0 },
  usageLimit: { type: Number, min: 1 },
  usageCount: { type: Number, default: 0, min: 0 },
  expiresAt: { type: Date, required: true },
  isActive: { type: Boolean, default: true, index: true },
}, { timestamps: true });

export const Coupon = mongoose.model('Coupon', couponSchema);
