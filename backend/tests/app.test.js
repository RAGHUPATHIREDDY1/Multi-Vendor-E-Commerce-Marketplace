import mongoose from 'mongoose';
import { afterEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';

describe('API basics', () => {
  afterEach(() => {
    mongoose.connection.readyState = 0;
  });

  it('reports database connectivity when MongoDB is connected', async () => {
    mongoose.connection.readyState = 1;
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      message: 'Server is running',
      database: 'connected',
    });
  });

  it('reports service unavailable when MongoDB is disconnected', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(503);
    expect(response.body).toEqual({
      success: false,
      message: 'Database connection is unavailable',
      database: 'disconnected',
    });
  });

  it('rejects invalid product pagination before a database query', async () => {
    const response = await request(app).get('/api/products?page=not-a-number');

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Please check the submitted information.');
    expect(response.body.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: 'query.page' }),
    ]));
  });

  it('returns a clear service-unavailable response when MongoDB is disconnected', async () => {
    const response = await request(app).get('/api/products');

    expect(response.status).toBe(503);
    expect(response.body.message).toBe('The database is not connected. Configure MongoDB and try again.');
  });

  it('returns a clear not-found response for unknown endpoints', async () => {
    const response = await request(app).get('/api/not-a-route');

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('The requested endpoint does not exist.');
  });
});
