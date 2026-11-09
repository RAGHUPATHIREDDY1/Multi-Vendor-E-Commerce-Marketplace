import mongoose from 'mongoose';
import { randomUUID } from 'node:crypto';
import { Address } from '../models/Address.js';
import { Cart } from '../models/Cart.js';
import { Commission } from '../models/Commission.js';
import { Coupon } from '../models/Coupon.js';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { Vendor } from '../models/Vendor.js';
import { VendorOrder } from '../models/VendorOrder.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

export function calculateDiscount(coupon, subtotalMinor) {
  if (!coupon) return 0;
  if (!coupon.isActive || coupon.expiresAt <= new Date()) {
    throw new AppError('This coupon is no longer active.', 400);
  }
  if (coupon.usageLimit !== undefined && coupon.usageCount >= coupon.usageLimit) {
    throw new AppError('This coupon has reached its usage limit.', 400);
  }
  if (subtotalMinor < coupon.minimumOrderMinor) {
    throw new AppError('Your order does not meet the minimum for this coupon.', 400);
  }

  const discount = coupon.discountType === 'percentage'
    ? Math.round(subtotalMinor * coupon.discountValue / 100)
    : Math.round(coupon.discountValue * 100);
  return Math.min(discount, subtotalMinor, coupon.maximumDiscountMinor ?? subtotalMinor);
}

export function allocateDiscount(groups, discountMinor, subtotalMinor) {
  let remaining = discountMinor;
  return groups.map((group, index) => {
    const discount = index === groups.length - 1
      ? remaining
      : Math.floor(discountMinor * group.subtotalMinor / subtotalMinor);
    remaining -= discount;
    return { ...group, discountMinor: discount };
  });
}

export async function createCheckout({ customerId, addressId, couponCode = '' }) {
  if (!mongoose.connection.readyState) {
    throw new AppError('Database connection is unavailable.', 503);
  }

  const session = await mongoose.startSession();
  let createdOrder;
  try {
    await session.withTransaction(async () => {
      const [cart, address] = await Promise.all([
        Cart.findOne({ user: customerId }).populate('items.product').session(session),
        Address.findOne({ _id: addressId, user: customerId }).session(session),
      ]);
      if (!address) throw new AppError('Choose a saved delivery address.', 400);
      if (!cart?.items.length) throw new AppError('Your cart is empty.', 400);

      const grouped = new Map();
      let subtotalMinor = 0;
      for (const line of cart.items) {
        const product = line.product;
        if (!product || product.status !== 'active') throw new AppError('A product in your cart is no longer available.', 409);
        if (!product.vendor) throw new AppError(`${product.name} is not linked to an approved seller yet.`, 409);
        if (line.quantity > product.inventory) throw new AppError(`There is not enough stock for ${product.name}.`, 409);

        const vendor = await Vendor.findOne({ userId: product.vendor, approvalStatus: 'approved' }).session(session);
        if (!vendor) throw new AppError(`${product.name} is not currently sold by an approved seller.`, 409);
        const unitPriceMinor = Math.round(product.price * 100);
        const lineTotalMinor = unitPriceMinor * line.quantity;
        subtotalMinor += lineTotalMinor;
        const key = product.vendor.toString();
        const group = grouped.get(key) || { vendor: product.vendor, items: [], subtotalMinor: 0 };
        group.items.push({
          product: product._id,
          name: product.name,
          sku: product.sku || '',
          quantity: line.quantity,
          unitPriceMinor,
          lineTotalMinor,
        });
        group.subtotalMinor += lineTotalMinor;
        grouped.set(key, group);
      }

      const coupon = couponCode
        ? await Coupon.findOne({ code: couponCode.trim().toUpperCase() }).session(session)
        : null;
      if (couponCode && !coupon) throw new AppError('That coupon code is not valid.', 400);

      const discountMinor = calculateDiscount(coupon, subtotalMinor);
      const groups = allocateDiscount([...grouped.values()], discountMinor, subtotalMinor);
      const shippingMinor = env.SHIPPING_FEE_MINOR;
      const totalMinor = subtotalMinor - discountMinor + shippingMinor;
      if (totalMinor <= 0) throw new AppError('Order total must be greater than zero.', 400);
      const orderNumber = `MH-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 6).toUpperCase()}`;
      const [order] = await Order.create([{
        customer: customerId,
        orderNumber,
        subtotalMinor,
        discountMinor,
        shippingMinor,
        taxMinor: 0,
        totalMinor,
        address: address.toObject(),
        couponCode: coupon?.code || '',
        statusHistory: [{ status: 'PLACED', changedBy: customerId, note: 'Order created' }],
      }], { session });

      for (const group of groups) {
        for (const line of group.items) {
          const inventoryUpdate = await Product.updateOne(
            { _id: line.product, status: 'active', inventory: { $gte: line.quantity } },
            { $inc: { inventory: -line.quantity } },
            { session },
          );
          if (inventoryUpdate.modifiedCount !== 1) {
            throw new AppError(`Stock changed for ${line.name}. Please refresh your cart.`, 409);
          }
        }

        const commissionBaseMinor = group.subtotalMinor - group.discountMinor;
        const commissionMinor = Math.round(commissionBaseMinor * env.PLATFORM_COMMISSION_PERCENT / 100);
        const [vendorOrder] = await VendorOrder.create([{
          order: order._id,
          vendor: group.vendor,
          items: group.items,
          subtotalMinor: group.subtotalMinor,
          discountMinor: group.discountMinor,
          commissionMinor,
          vendorNetMinor: commissionBaseMinor - commissionMinor,
          statusHistory: [{ status: 'PLACED', changedBy: customerId, note: 'Order created' }],
        }], { session });

        await Commission.create([{
          order: order._id,
          vendorOrder: vendorOrder._id,
          vendor: group.vendor,
          orderAmountMinor: commissionBaseMinor,
          commissionPercent: env.PLATFORM_COMMISSION_PERCENT,
          commissionAmountMinor: commissionMinor,
          vendorNetMinor: commissionBaseMinor - commissionMinor,
        }], { session });
      }

      if (coupon) {
        const couponUpdate = await Coupon.updateOne(
          { _id: coupon._id, isActive: true, ...(coupon.usageLimit !== undefined ? { usageCount: { $lt: coupon.usageLimit } } : {}) },
          { $inc: { usageCount: 1 } },
          { session },
        );
        if (couponUpdate.modifiedCount !== 1) throw new AppError('This coupon was just used up. Please try another.', 409);
      }

      await Cart.deleteOne({ _id: cart._id }, { session });
      createdOrder = order;
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    if (error.message?.includes('Transaction numbers are only allowed')) {
      throw new AppError('Checkout requires MongoDB Atlas or another replica-set deployment for safe inventory transactions.', 503);
    }
    throw error;
  } finally {
    await session.endSession();
  }

  return createdOrder;
}

export async function getOrderForCustomer(orderId, customerId) {
  const order = await Order.findOne({ _id: orderId, customer: customerId }).lean();
  if (!order) throw new AppError('Order was not found.', 404);
  const vendorOrders = await VendorOrder.find({ order: order._id }).populate('vendor', 'name').lean();
  return { ...order, vendorOrders };
}

export async function getCustomerOrders(customerId) {
  return Order.find({ customer: customerId }).sort({ createdAt: -1 }).lean();
}

export async function getVendorOrders(vendorId) {
  return VendorOrder.find({ vendor: vendorId }).populate('order', 'orderNumber status paymentStatus createdAt').sort({ createdAt: -1 }).lean();
}

export async function getAdminDashboard() {
  const [customers, vendors, approvedVendors, pendingVendors, orders, sales, commissions] = await Promise.all([
    mongoose.model('User').countDocuments({ role: 'customer' }),
    Vendor.countDocuments(),
    Vendor.countDocuments({ approvalStatus: 'approved' }),
    Vendor.countDocuments({ approvalStatus: 'pending' }),
    Order.countDocuments(),
    Order.aggregate([{ $match: { paymentStatus: 'PAID' } }, { $group: { _id: null, total: { $sum: '$totalMinor' } } }]),
    Commission.aggregate([{ $match: { status: { $in: ['EARNED', 'SETTLED'] } } }, { $group: { _id: null, total: { $sum: '$commissionAmountMinor' } } }]),
  ]);
  return {
    customers,
    vendors,
    approvedVendors,
    pendingVendors,
    orders,
    salesMinor: sales[0]?.total || 0,
    commissionsMinor: commissions[0]?.total || 0,
  };
}
