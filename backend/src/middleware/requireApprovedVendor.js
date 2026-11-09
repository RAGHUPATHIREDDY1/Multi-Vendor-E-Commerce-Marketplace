import { Vendor } from '../models/Vendor.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const requireApprovedVendor = asyncHandler(async (req, res, next) => {
  const vendor = await Vendor.findOne({ userId: req.user._id, approvalStatus: 'approved' });
  if (!vendor) throw new AppError('Your store must be approved before you can sell products.', 403);
  req.vendor = vendor;
  next();
});
