import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  find: vi.fn(),
  findOne: vi.fn(),
  countDocuments: vi.fn(),
}));

vi.mock('../src/models/Product.js', () => ({
  Product: {
    find: mocks.find,
    findOne: mocks.findOne,
    countDocuments: mocks.countDocuments,
  },
}));

import { findActiveProduct, searchProducts } from '../src/services/productService.js';
import { AppError } from '../src/utils/AppError.js';

describe('product catalog service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('applies search, price, category, sort, and pagination filters', async () => {
    const query = {
      select: vi.fn(),
      sort: vi.fn(),
      skip: vi.fn(),
      limit: vi.fn(),
      lean: vi.fn(),
    };
    query.select.mockReturnValue(query);
    query.sort.mockReturnValue(query);
    query.skip.mockReturnValue(query);
    query.limit.mockReturnValue(query);
    query.lean.mockResolvedValue([{ slug: 'mug' }]);
    mocks.find.mockReturnValue(query);
    mocks.countDocuments.mockResolvedValue(1);

    const result = await searchProducts({
      q: 'ceramic mug',
      category: 'Home.*',
      minPrice: 10,
      maxPrice: 40,
      sort: 'price_asc',
      page: 2,
      limit: 6,
    });

    const filter = mocks.find.mock.calls[0][0];
    expect(filter.status).toBe('active');
    expect(filter.$text).toEqual({ $search: 'ceramic mug' });
    expect(filter.category.test('Home.*')).toBe(true);
    expect(filter.category.test('Home.any')).toBe(false);
    expect(filter.price).toEqual({ $gte: 10, $lte: 40 });
    expect(query.skip).toHaveBeenCalledWith(6);
    expect(query.sort).toHaveBeenCalledWith({ price: 1 });
    expect(result).toEqual({ items: [{ slug: 'mug' }], page: 2, limit: 6, total: 1, pages: 1 });
  });

  it('returns a not-found error when an active product does not exist', async () => {
    mocks.find.mockReturnValue({
      select: vi.fn(),
    });

    mocks.findOne.mockReturnValue({ lean: vi.fn().mockResolvedValue(null) });

    await expect(findActiveProduct('missing-item')).rejects.toMatchObject({
      statusCode: 404,
      message: 'We could not find that product.',
    });
    expect(mocks.findOne.mock.calls[0][0]).toEqual({ status: 'active', slug: 'missing-item' });
  });
});
