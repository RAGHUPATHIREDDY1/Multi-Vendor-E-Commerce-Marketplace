import { Client } from '@elastic/elasticsearch';
import { env } from '../config/env.js';

let client;
let connected = false;
const indexName = 'marketplace-products';

export async function connectSearch() {
  if (!env.ELASTICSEARCH_URL) {
    console.log('Elasticsearch is not configured; using MongoDB text search.');
    return false;
  }
  client = new Client({ node: env.ELASTICSEARCH_URL, requestTimeout: 3000, maxRetries: 0 });
  try {
    await client.ping();
    const indexExists = await client.indices.exists({ index: indexName });
    if (!indexExists) {
      await client.indices.create({
        index: indexName,
        mappings: { properties: {
          name: { type: 'text' },
          description: { type: 'text' },
          category: { type: 'keyword' },
          price: { type: 'float' },
          rating: { type: 'float' },
          status: { type: 'keyword' },
        } },
      });
    }
    connected = true;
    console.log('Elasticsearch product search connected.');
    return true;
  } catch {
    connected = false;
    console.warn('Elasticsearch is unavailable; using MongoDB text search.');
    return false;
  }
}

export async function searchProductIds({ q, category, minPrice, maxPrice, sort, page, limit }) {
  if (!connected || !q) return null;
  const filters = [{ term: { status: 'active' } }];
  if (category) filters.push({ term: { category: category.toLowerCase() } });
  const range = {};
  if (minPrice !== undefined) range.gte = minPrice;
  if (maxPrice !== undefined) range.lte = maxPrice;
  if (Object.keys(range).length) filters.push({ range: { price: range } });

  const sortBy = sort === 'price_asc' ? [{ price: 'asc' }] : sort === 'price_desc' ? [{ price: 'desc' }] : [{ _score: 'desc' }];
  const response = await client.search({
    index: indexName,
    from: (page - 1) * limit,
    size: limit,
    query: {
      bool: {
        must: [{ multi_match: { query: q, fields: ['name^3', 'description', 'category'] } }],
        filter: filters,
      },
    },
    sort: sortBy,
  });
  return { ids: response.hits.hits.map((hit) => hit._id), total: response.hits.total.value };
}

export async function indexProduct(product) {
  if (!connected) return;
  await client.index({
    index: indexName,
    id: product._id.toString(),
    document: {
      name: product.name,
      description: product.description,
      category: product.category.toLowerCase(),
      price: product.price,
      rating: product.rating || 0,
      status: product.status,
    },
    refresh: 'wait_for',
  });
}

export async function removeIndexedProduct(productId) {
  if (!connected) return;
  try {
    await client.delete({ index: indexName, id: productId.toString(), refresh: 'wait_for' });
  } catch (error) {
    if (error.statusCode !== 404) throw error;
  }
}

export function searchStatus() {
  return connected ? 'connected' : 'mongodb-fallback';
}
