import { connectDatabase } from '../config/db.js';
import { Category } from '../models/Category.js';
import { Product } from '../models/Product.js';
import { User } from '../models/User.js';
import { Vendor } from '../models/Vendor.js';

const products = [
  {
    name: 'Stoneware Sunday Mug',
    slug: 'stoneware-sunday-mug',
    description: 'A hand-finished stoneware mug with a soft speckled glaze. Each one has its own tiny variations, which is part of the charm.',
    price: 28,
    category: 'Kitchen',
    inventory: 18,
    images: ['https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=900&q=85'],
  },
  {
    name: 'Everyday Market Tote',
    slug: 'everyday-market-tote',
    description: 'A roomy, sturdy cotton tote made for market mornings, library runs, and everything in between.',
    price: 34,
    category: 'Accessories',
    inventory: 24,
    images: ['https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=900&q=85'],
  },
  {
    name: 'Soft Morning Throw',
    slug: 'soft-morning-throw',
    description: 'A relaxed woven throw with a lovely bit of texture. Just right for the sofa, a reading chair, or a quiet afternoon.',
    price: 76,
    category: 'Home',
    inventory: 9,
    images: ['https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=900&q=85'],
  },
  {
    name: 'Little Wildflower Vase',
    slug: 'little-wildflower-vase',
    description: 'A small sculptural vase that looks just as nice with one stem as it does on its own.',
    price: 42,
    category: 'Home',
    inventory: 12,
    images: ['https://images.unsplash.com/photo-1578500494198-246f612d3b3d?auto=format&fit=crop&w=900&q=85'],
  },
  {
    name: 'Citrus Grove Candle',
    slug: 'citrus-grove-candle',
    description: 'Bright citrus, green leaves, and a little sunshine. Poured in a reusable glass vessel by a small-batch maker.',
    price: 24,
    category: 'Wellness',
    inventory: 31,
    images: ['https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=900&q=85'],
  },
  {
    name: 'Daily Ritual Notebook',
    slug: 'daily-ritual-notebook',
    description: 'An easy-to-carry notebook with thick, smooth paper for plans, lists, and the ideas you do not want to forget.',
    price: 19,
    category: 'Accessories',
    inventory: 40,
    images: ['https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&w=900&q=85'],
  },
  {
    name: 'Cloud Nine Breakfast Bowl',
    slug: 'cloud-nine-breakfast-bowl',
    description: 'A cheerful handmade bowl for slow breakfasts and late-night snacks. Finished with a glossy cream glaze.',
    price: 32,
    category: 'Kitchen',
    inventory: 15,
    images: ['https://images.unsplash.com/photo-1493106641515-6b5631de4bb9?auto=format&fit=crop&w=900&q=85'],
  },
  {
    name: 'Sunday Bloom Print',
    slug: 'sunday-bloom-print',
    description: 'A warm, colorful art print made by an independent illustrator. Printed on archival matte paper.',
    price: 36,
    category: 'Home',
    inventory: 20,
    images: ['https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=900&q=85'],
  },
];

try {
  await connectDatabase();
  const categoryNames = [...new Set(products.map((product) => product.category))];
  const categories = new Map();
  for (const name of categoryNames) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    categories.set(name, await Category.findOneAndUpdate(
      { slug },
      { $setOnInsert: { name, slug } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ));
  }

  let demoVendorUser = null;
  if (process.env.SEED_VENDOR_EMAIL && process.env.SEED_VENDOR_PASSWORD) {
    const email = process.env.SEED_VENDOR_EMAIL.trim().toLowerCase();
    demoVendorUser = await User.findOne({ email });
    if (!demoVendorUser) {
      demoVendorUser = await User.create({
        name: process.env.SEED_VENDOR_NAME || 'Sample Shop Owner',
        email,
        password: process.env.SEED_VENDOR_PASSWORD,
        role: 'vendor',
      });
    }
    await Vendor.findOneAndUpdate(
      { userId: demoVendorUser._id },
      { $setOnInsert: { userId: demoVendorUser._id, storeName: 'Sample Market Shop', slug: 'sample-market-shop', description: 'Optional local development seller used only when seed credentials are configured.', approvalStatus: 'approved' } },
      { upsert: true, new: true },
    );
  }

  let inserted = 0;
  for (const product of products) {
    const result = await Product.updateOne(
      { slug: product.slug },
      { $setOnInsert: { ...product, categoryId: categories.get(product.category)._id, vendor: demoVendorUser?._id || null } },
      { upsert: true },
    );
    if (result.upsertedCount) inserted += 1;
  }
  console.log(`Seed finished. Added ${inserted} new products and ensured ${categoryNames.length} categories exist.`);
  if (!demoVendorUser) console.log('Products are browse-only until SEED_VENDOR_EMAIL and SEED_VENDOR_PASSWORD are configured for an approved sample seller.');
} catch (error) {
  console.error('Unable to seed products:', error);
  process.exitCode = 1;
} finally {
  await import('mongoose').then(({ default: mongoose }) => mongoose.disconnect());
}
