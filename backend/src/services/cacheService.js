import { createClient } from 'redis';
import { env } from '../config/env.js';

let client;
let connected = false;

export async function connectCache() {
  if (!env.REDIS_URL) {
    console.log('Redis is not configured; using MongoDB-backed catalog and cart storage.');
    return false;
  }
  client = createClient({ url: env.REDIS_URL, socket: { connectTimeout: 3000, reconnectStrategy: false } });
  client.on('error', () => {
    connected = false;
  });
  try {
    await client.connect();
    connected = true;
    console.log('Redis cache connected.');
    return true;
  } catch {
    connected = false;
    console.warn('Redis is unavailable; using MongoDB-backed catalog and cart storage.');
    return false;
  }
}

export async function getCached(key) {
  if (!connected) return null;
  try {
    const value = await client.get(key);
    return value ? JSON.parse(value) : null;
  } catch {
    console.warn('Redis cache read failed; using MongoDB.');
    return null;
  }
}

export async function setCached(key, value, seconds = 60) {
  if (!connected) return;
  try {
    await client.set(key, JSON.stringify(value), { EX: seconds });
  } catch {
    console.warn('Redis cache write failed; continuing without cache.');
  }
}

export function cacheStatus() {
  return connected ? 'connected' : 'mongodb-fallback';
}
