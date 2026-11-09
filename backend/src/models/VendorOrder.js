import mongoose from 'mongoose';

const vendorOrderSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    sku: { type: String, default: '' },
    quantity: { type: Number, required: true, min: 1 },
    unitPriceMinor: { type: Number, required: true, min: 0 },
    lineTotalMinor: { type: Number, required: true, min: 0 },
  }],
  subtotalMinor: { type: Number, required: true, min: 0 },
  discountMinor: { type: Number, default: 0, min: 0 },
  commissionMinor: { type: Number, required: true, min: 0 },
  vendorNetMinor: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['PLACED', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURN_REQUESTED', 'RETURNED'], default: 'PLACED', index: true },
  statusHistory: [{ status: String, changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, note: { type: String, maxlength: 300 }, createdAt: { type: Date, default: Date.now } }],
}, { timestamps: true });

vendorOrderSchema.index({ order: 1, vendor: 1 }, { unique: true });
vendorOrderSchema.index({ vendor: 1, createdAt: -1 });

export const VendorOrder = mongoose.model('VendorOrder', vendorOrderSchema);
