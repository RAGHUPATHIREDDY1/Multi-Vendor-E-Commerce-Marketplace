import mongoose from 'mongoose';
import { env } from './env.js';

let connectionPromise;

export async function connectDatabase() {
  if (mongoose.connection.readyState === 1) return mongoose;
  if (connectionPromise) return connectionPromise;
  if (mongoose.connection.readyState === 2) {
    try {
      return await mongoose.connection.asPromise();
    } catch {
      throw new Error('MongoDB connection failed. Check the Atlas URI, network access, and database user credentials.');
    }
  }
  if (!env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not configured.');
  }

  connectionPromise = mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 })
    .then(() => {
      console.log('Connected to MongoDB.');
      return mongoose;
    })
    .catch(() => {
      throw new Error('MongoDB connection failed. Check the Atlas URI, network access, and database user credentials.');
    })
    .finally(() => {
      connectionPromise = undefined;
    });

  return connectionPromise;
}
