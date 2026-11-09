import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { env } from '../config/env.js';

export const authenticate = asyncHandler(async (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization?.startsWith('Bearer ')) {
    throw new AppError('Please sign in to continue.', 401);
  }

  let payload;
  try {
    payload = jwt.verify(authorization.slice(7), env.JWT_SECRET);
  } catch {
    throw new AppError('Your session is invalid or has expired. Please sign in again.', 401);
  }

  const user = await User.findById(payload.sub).select('_id name email role isActive');
  if (!user) throw new AppError('This account is no longer available.', 401);
  if (!user.isActive) throw new AppError('This account has been deactivated.', 403);

  req.user = user;
  next();
});
