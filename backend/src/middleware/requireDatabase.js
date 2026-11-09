import mongoose from 'mongoose';
import { AppError } from '../utils/AppError.js';

export function requireDatabase(req, res, next) {
  if (mongoose.connection.readyState !== 1) {
    return next(new AppError('The database is not connected. Configure MongoDB and try again.', 503));
  }

  next();
}
