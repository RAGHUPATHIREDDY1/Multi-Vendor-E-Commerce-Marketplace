import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  label: { type: String, trim: true, maxlength: 40, default: 'Home' },
  recipient: { type: String, required: true, trim: true, maxlength: 100 },
  phone: { type: String, required: true, trim: true, maxlength: 30 },
  line1: { type: String, required: true, trim: true, maxlength: 160 },
  line2: { type: String, trim: true, maxlength: 160, default: '' },
  city: { type: String, required: true, trim: true, maxlength: 80 },
  region: { type: String, required: true, trim: true, maxlength: 80 },
  postalCode: { type: String, required: true, trim: true, maxlength: 24 },
  country: { type: String, required: true, trim: true, maxlength: 80 },
  isDefault: { type: Boolean, default: false },
}, { timestamps: true });

addressSchema.index({ user: 1, isDefault: -1 });

export const Address = mongoose.model('Address', addressSchema);
