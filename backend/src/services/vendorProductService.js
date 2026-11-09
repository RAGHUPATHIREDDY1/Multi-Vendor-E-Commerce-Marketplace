import { Category } from '../models/Category.js';
import { Product } from '../models/Product.js';
import { AppError } from '../utils/AppError.js';
import { indexProduct, removeIndexedProduct } from './searchService.js';

function slugify(value) {
  return value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function findCategory(name) {
  const category = await Category.findOne({ name: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'), isActive: true });
  if (!category) throw new AppError('Choose an active marketplace category.', 400);
  return category;
}

export async function listVendorProducts(vendorId) {
  return Product.find({ vendor: vendorId }).sort({ updatedAt: -1 }).lean();
}

export async function createVendorProduct(vendorId, input) {
  const category = await findCategory(input.category);
  const slug = `${slugify(input.name)}-${Date.now().toString(36)}`;
  const product = await Product.create({
    ...input,
    category: category.name,
    categoryId: category._id,
    vendor: vendorId,
    slug,
  });
  try { await indexProduct(product); } catch { console.warn('Product index sync failed; MongoDB is still authoritative.'); }
  return product;
}

export async function updateVendorProduct(vendorId, productId, input) {
  const product = await Product.findOne({ _id: productId, vendor: vendorId });
  if (!product) throw new AppError('Product was not found in your store.', 404);
  if (input.category) {
    const category = await findCategory(input.category);
    product.categoryId = category._id;
    product.category = category.name;
  }
  Object.assign(product, Object.fromEntries(Object.entries(input).filter(([key]) => key !== 'category')));
  await product.save();
  try { await indexProduct(product); } catch { console.warn('Product index sync failed; MongoDB is still authoritative.'); }
  return product;
}

export async function deleteVendorProduct(vendorId, productId) {
  const product = await Product.findOneAndDelete({ _id: productId, vendor: vendorId });
  if (!product) throw new AppError('Product was not found in your store.', 404);
  try { await removeIndexedProduct(product._id); } catch { console.warn('Product index cleanup failed; reindex the catalog to repair it.'); }
}
