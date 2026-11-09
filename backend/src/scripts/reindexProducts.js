import mongoose from 'mongoose';
import { connectDatabase } from '../config/db.js';
import { Product } from '../models/Product.js';
import { indexProduct } from '../services/searchService.js';
import { connectSearch } from '../services/searchService.js';

try {
  await connectDatabase();
  if (!await connectSearch()) throw new Error('Elasticsearch is not configured or available.');
  const cursor = Product.find().cursor();
  let count = 0;
  for await (const product of cursor) {
    await indexProduct(product);
    count += 1;
  }
  console.log(`Indexed ${count} products.`);
} catch (error) {
  console.error(`Product reindex failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
