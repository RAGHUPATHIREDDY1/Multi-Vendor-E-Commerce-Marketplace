import { Notification } from '../models/Notification.js';
import { Product } from '../models/Product.js';
import { User } from '../models/User.js';
import { Vendor } from '../models/Vendor.js';
import { VendorOrder } from '../models/VendorOrder.js';
import { AppError } from '../utils/AppError.js';

export async function listVendors(approvalStatus) {
  const filter = approvalStatus ? { approvalStatus } : {};
  return Vendor.find(filter).populate('userId', 'name email isActive').sort({ createdAt: -1 }).lean();
}

export async function setVendorApproval({ vendorId, approvalStatus, rejectionReason }) {
  const vendor = await Vendor.findById(vendorId);
  if (!vendor) throw new AppError('Vendor application was not found.', 404);
  if (approvalStatus === 'rejected' && !rejectionReason) {
    throw new AppError('A reason is required when rejecting an application.', 400);
  }

  vendor.approvalStatus = approvalStatus;
  vendor.rejectionReason = approvalStatus === 'rejected' ? rejectionReason : '';
  await vendor.save();
  await Notification.create({
    user: vendor.userId,
    type: 'vendor_application',
    title: `Store application ${approvalStatus}`,
    message: approvalStatus === 'rejected' ? rejectionReason : `Your store has been ${approvalStatus}.`,
    link: '/vendor',
  });
  return vendor;
}

export async function setCustomerActive(userId, isActive) {
  const user = await User.findOneAndUpdate(
    { _id: userId, role: 'customer' },
    { $set: { isActive } },
    { new: true, select: 'name email role isActive' },
  );
  if (!user) throw new AppError('Customer was not found.', 404);
  return user;
}

export async function getVendorProfile(userId) {
  const vendor = await Vendor.findOne({ userId }).lean();
  if (!vendor) throw new AppError('Vendor profile was not found.', 404);
  return vendor;
}

export async function getVendorAnalytics(vendorId) {
  const [products, sales] = await Promise.all([
    Product.countDocuments({ vendor: vendorId }),
    VendorOrder.aggregate([
      { $match: { vendor: vendorId, status: { $ne: 'CANCELLED' } } },
      { $lookup: { from: 'orders', localField: 'order', foreignField: '_id', as: 'parentOrder' } },
      { $unwind: '$parentOrder' },
      { $match: { 'parentOrder.paymentStatus': 'PAID' } },
      { $group: { _id: null, orders: { $sum: 1 }, salesMinor: { $sum: '$subtotalMinor' }, commissionMinor: { $sum: '$commissionMinor' }, earningsMinor: { $sum: '$vendorNetMinor' } } },
    ]),
  ]);
  return { products, ...(sales[0] || { orders: 0, salesMinor: 0, commissionMinor: 0, earningsMinor: 0 }) };
}
