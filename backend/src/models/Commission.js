import mongoose from 'mongoose';

const commissionSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
  vendorOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'VendorOrder', required: true, unique: true },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  orderAmountMinor: { type: Number, required: true, min: 0 },
  commissionPercent: { type: Number, required: true, min: 0, max: 100 },
  commissionAmountMinor: { type: Number, required: true, min: 0 },
  vendorNetMinor: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['PENDING', 'EARNED', 'REVERSED', 'SETTLED'], default: 'PENDING', index: true },
}, { timestamps: true });

export const Commission = mongoose.model('Commission', commissionSchema);
