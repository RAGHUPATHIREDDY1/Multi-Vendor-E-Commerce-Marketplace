import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  description: { type: String, trim: true, maxlength: 500, default: '' },
  isActive: { type: Boolean, default: true, index: true },
}, { timestamps: true });

export const Category = mongoose.model('Category', categorySchema);
