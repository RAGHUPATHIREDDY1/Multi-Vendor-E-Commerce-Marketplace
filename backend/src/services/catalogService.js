import { Category } from '../models/Category.js';

export async function listCategories() {
  return Category.find({ isActive: true }).sort({ name: 1 }).lean();
}
