import mongoose from 'mongoose';
import { Product } from '../models/Product.js';
import { AppError } from '../utils/AppError.js';
import { getCached, setCached } from './cacheService.js';
import { searchProductIds } from './searchService.js';

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function searchProducts({ q, category, minPrice, maxPrice, sort, page, limit }) {
  const cacheKey = `product-list:${JSON.stringify({ q, category, minPrice, maxPrice, sort, page, limit })}`;
  const cached = await getCached(cacheKey);
  if (cached) return cached;

  if (q) {
    try {
      const elasticResult = await searchProductIds({ q, category, minPrice, maxPrice, sort, page, limit });
      if (elasticResult) {
        const products = await Product.find({ _id: { $in: elasticResult.ids }, status: 'active' })
          .select('name slug description price images category inventory vendor createdAt')
          .lean();
        const productById = new Map(products.map((product) => [product._id.toString(), product]));
        const result = {
          items: elasticResult.ids.map((id) => productById.get(id)).filter(Boolean),
          page,
          limit,
          total: elasticResult.total,
          pages: Math.ceil(elasticResult.total / limit),
        };
        await setCached(cacheKey, result);
        return result;
      }
    } catch {
      console.warn('Elasticsearch search failed; falling back to MongoDB.');
    }
  }

  const filter = { status: 'active' };

  if (q) filter.$text = { $search: q };
  if (category) filter.category = new RegExp(`^${escapeRegExp(category)}$`, 'i');
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined) filter.price.$gte = minPrice;
    if (maxPrice !== undefined) filter.price.$lte = maxPrice;
  }

  const sortBy = sort === 'price_asc' ? { price: 1 } : sort === 'price_desc' ? { price: -1 } : { createdAt: -1 };
  const [items, total] = await Promise.all([
    Product.find(filter)
      .select('name slug description price images category inventory vendor createdAt')
      .sort(sortBy)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter),
  ]);

  const result = { items, page, limit, total, pages: Math.ceil(total / limit) };
  await setCached(cacheKey, result);
  return result;
}

export async function findActiveProduct(idOrSlug) {
  const cacheKey = `product-detail:${idOrSlug.toLowerCase()}`;
  const cached = await getCached(cacheKey);
  if (cached) return cached;
  const product = await Product.findOne({
    status: 'active',
    ...(mongoose.isValidObjectId(idOrSlug) ? { _id: idOrSlug } : { slug: idOrSlug.toLowerCase() }),
  }).lean();

  if (!product) throw new AppError('We could not find that product.', 404);
  await setCached(cacheKey, product, 120);
  return product;
}
