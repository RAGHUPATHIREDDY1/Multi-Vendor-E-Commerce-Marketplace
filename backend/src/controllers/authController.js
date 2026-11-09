import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Vendor } from '../models/Vendor.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { env } from '../config/env.js';

function createToken(user) {
  return jwt.sign({ sub: user.id }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const existingUser = await User.exists({ email: email.toLowerCase() });
  if (existingUser) throw new AppError('An account with this email already exists.', 409);

  const user = await User.create({ name, email, password, role: 'customer' });
  res.status(201).json({ token: createToken(user), user: publicUser(user) });
});

export const login = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email.toLowerCase() }).select('+password');
  if (!user || !(await user.comparePassword(req.body.password)) || !user.isActive) {
    throw new AppError('Email or password is incorrect.', 401);
  }

  res.json({ token: createToken(user), user: publicUser(user) });
});

export const registerVendor = asyncHandler(async (req, res) => {
  const { name, email, password, storeName, description } = req.body;
  const normalizedEmail = email.toLowerCase();
  if (await User.exists({ email: normalizedEmail })) {
    throw new AppError('An account with this email already exists.', 409);
  }

  const slugBase = storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const slug = `${slugBase}-${Date.now().toString(36)}`;
  const session = await User.startSession();
  let user;
  try {
    await session.withTransaction(async () => {
      [user] = await User.create([{ name, email: normalizedEmail, password, role: 'vendor' }], { session });
      await Vendor.create([{ userId: user._id, storeName, slug, description }], { session });
    });
  } finally {
    await session.endSession();
  }

  res.status(201).json({
    token: createToken(user),
    user: publicUser(user),
    vendor: { storeName, slug, approvalStatus: 'pending' },
  });
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  res.json({ user: publicUser(req.user) });
});
