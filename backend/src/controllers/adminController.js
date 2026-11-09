import { Category } from '../models/Category.js';
import { Product } from '../models/Product.js';
import { User } from '../models/User.js';
import { setCustomerActive, setVendorApproval, listVendors } from '../services/vendorService.js';
import { getAdminDashboard } from '../services/orderService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';

export const vendors = asyncHandler(async (req, res) => {
  res.json({ vendors: await listVendors(req.query.status) });
});

export const updateVendor = asyncHandler(async (req, res) => {
  const vendor = await setVendorApproval({ vendorId: req.params.vendorId, ...req.body });
  res.json({ vendor });
});

export const customers = asyncHandler(async (req, res) => {
  const users = await User.find({ role: 'customer' }).select('name email phone isActive createdAt').sort({ createdAt: -1 }).limit(200).lean();
  res.json({ customers: users });
});

export const updateCustomer = asyncHandler(async (req, res) => {
  res.json({ customer: await setCustomerActive(req.params.userId, req.body.isActive) });
});

export const dashboard = asyncHandler(async (req, res) => {
  res.json({ dashboard: await getAdminDashboard() });
});

export const listAllProducts = asyncHandler(async (req, res) => {
  const products = await Product.find().populate('vendor', 'name').sort({ createdAt: -1 }).limit(200).lean();
  res.json({ products });
});

export const categories = asyncHandler(async (req, res) => {
  res.json({ categories: await Category.find().sort({ name: 1 }).lean() });
});

export const createCategory = asyncHandler(async (req, res) => {
  const slug = req.body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  if (await Category.exists({ slug })) throw new AppError('A category with this name already exists.', 409);
  const category = await Category.create({ ...req.body, slug });
  res.status(201).json({ category });
});

export const setCategoryActive = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndUpdate(req.params.categoryId, { isActive: req.body.isActive }, { new: true });
  if (!category) throw new AppError('Category was not found.', 404);
  res.json({ category });
});
