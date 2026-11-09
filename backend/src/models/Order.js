import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  orderNumber: { type: String, required: true, unique: true },
  status: { type: String, enum: ['PLACED', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURN_REQUESTED', 'RETURNED'], default: 'PLACED', index: true },
  statusHistory: [{ status: { type: String, required: true }, changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, note: { type: String, maxlength: 300 }, createdAt: { type: Date, default: Date.now } }],
  subtotalMinor: { type: Number, required: true, min: 0 },
  discountMinor: { type: Number, default: 0, min: 0 },
  shippingMinor: { type: Number, default: 0, min: 0 },
  taxMinor: { type: Number, default: 0, min: 0 },
  totalMinor: { type: Number, required: true, min: 0 },
  address: { type: mongoose.Schema.Types.Mixed, required: true },
  paymentStatus: { type: String, enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'], default: 'PENDING', index: true },
  couponCode: { type: String, default: '' },
}, { timestamps: true });

orderSchema.index({ customer: 1, createdAt: -1 });

export const Order = mongoose.model('Order', orderSchema);
