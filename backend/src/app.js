import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { env } from './config/env.js';
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import commerceRoutes from './routes/commerceRoutes.js';
import vendorRoutes from './routes/vendorRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { requireDatabase } from './middleware/requireDatabase.js';
import { asyncHandler } from './utils/asyncHandler.js';
import { listCategories } from './services/catalogService.js';
import { AppError } from './utils/AppError.js';
import { errorHandler } from './middleware/errorHandler.js';
import paymentRoutes from './routes/paymentRoutes.js';
import { webhook } from './controllers/paymentController.js';
import couponRoutes from './routes/couponRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import swaggerUi from 'swagger-ui-express';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const apiDocumentation = {
  openapi: '3.0.3',
  info: { title: 'MultiVendorMarketplace API', version: '1.0.0' },
  servers: [{ url: '/api' }],
  paths: {
    '/health': { get: { summary: 'Database-aware API health check', responses: { 200: { description: 'API and database are available' }, 503: { description: 'Database is unavailable' } } } },
    '/auth/register': { post: { summary: 'Register a customer account', responses: { 201: { description: 'Account created' } } } },
    '/auth/vendor/register': { post: { summary: 'Submit a vendor store application', responses: { 201: { description: 'Application submitted' } } } },
    '/auth/login': { post: { summary: 'Sign in', responses: { 200: { description: 'Signed in' } } } },
    '/products': { get: { summary: 'Search and filter active products', responses: { 200: { description: 'Product page' } } } },
    '/cart': { get: { summary: 'Read the authenticated customer cart', responses: { 200: { description: 'Cart contents' } } } },
    '/checkout': { post: { summary: 'Create a transactional multi-vendor order', responses: { 201: { description: 'Order created with payment pending' } } } },
    '/payments/orders': { post: { summary: 'Create a Razorpay payment order', responses: { 201: { description: 'Provider order created' }, 503: { description: 'Razorpay credentials are not configured' } } } },
  },
};

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.CLIENT_URL }));
app.post('/api/payments/webhook', express.raw({ type: 'application/json', limit: '100kb' }), requireDatabase, webhook);
app.use(express.json({ limit: '100kb' }));
app.use('/uploads', express.static(path.join(path.dirname(fileURLToPath(import.meta.url)), '../uploads')));

app.get('/api/health', (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: 'Database connection is unavailable',
      database: 'disconnected',
    });
  }

  res.json({
    success: true,
    message: 'Server is running',
    database: 'connected',
  });
});
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.get('/api/categories', requireDatabase, asyncHandler(async (req, res) => {
  res.json({ categories: await listCategories() });
}));
app.use('/api', commerceRoutes);
app.use('/api/vendor', vendorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(apiDocumentation));

app.use((req, res, next) => next(new AppError('The requested endpoint does not exist.', 404)));
app.use(errorHandler);
