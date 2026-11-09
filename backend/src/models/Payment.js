import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, unique: true, index: true },
  provider: { type: String, enum: ['razorpay', 'development'], required: true },
  providerOrderId: { type: String, unique: true, sparse: true },
  providerPaymentId: { type: String, default: '' },
  amountMinor: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'INR', uppercase: true },
  status: { type: String, enum: ['CREATED', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'REFUNDED'], default: 'CREATED', index: true },
  signatureVerified: { type: Boolean, default: false },
  idempotencyKey: { type: String, default: '' },
}, { timestamps: true });

export const Payment = mongoose.model('Payment', paymentSchema);
