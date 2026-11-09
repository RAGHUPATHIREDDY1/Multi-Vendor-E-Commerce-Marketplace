import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 160 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, required: true, trim: true, maxlength: 5000 },
    price: { type: Number, required: true, min: 0 },
    images: {
      type: [{ type: String, trim: true }],
      default: [],
      validate: [(images) => images.length <= 10, 'A product can have at most 10 images'],
    },
    category: { type: String, required: true, trim: true, maxlength: 80 },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    originalPrice: { type: Number, min: 0 },
    sku: { type: String, trim: true, uppercase: true, maxlength: 64 },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    inventory: { type: Number, required: true, min: 0, validate: Number.isInteger, default: 0 },
    status: { type: String, enum: ['active', 'draft'], default: 'active' },
  },
  { timestamps: true }
);

productSchema.index({ status: 1, createdAt: -1 });
productSchema.index({ name: 'text', description: 'text', category: 'text' });
productSchema.index({ vendor: 1, status: 1, createdAt: -1 });
productSchema.index({ categoryId: 1, status: 1, price: 1 });

export const Product = mongoose.model('Product', productSchema);
