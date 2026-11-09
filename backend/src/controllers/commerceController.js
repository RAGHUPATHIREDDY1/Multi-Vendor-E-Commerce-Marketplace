import { Address } from '../models/Address.js';
import { Order } from '../models/Order.js';
import { VendorOrder } from '../models/VendorOrder.js';
import { Commission } from '../models/Commission.js';
import { Product } from '../models/Product.js';
import mongoose from 'mongoose';
import { addCartItem, getCart, removeCartItem, setCartItemQuantity } from '../services/cartService.js';
import { createCheckout, getCustomerOrders, getOrderForCustomer, getVendorOrders } from '../services/orderService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';

export const readCart = asyncHandler(async (req, res) => res.json({ cart: await getCart(req.user._id) }));
export const addItem = asyncHandler(async (req, res) => {
  res.status(200).json({ cart: await addCartItem(req.user._id, req.body.productId, req.body.quantity) });
});
export const updateItem = asyncHandler(async (req, res) => {
  res.json({ cart: await setCartItemQuantity(req.user._id, req.params.productId, req.body.quantity) });
});
export const removeItem = asyncHandler(async (req, res) => {
  res.json({ cart: await removeCartItem(req.user._id, req.params.productId) });
});
export const listAddresses = asyncHandler(async (req, res) => {
  res.json({ addresses: await Address.find({ user: req.user._id }).sort({ isDefault: -1, createdAt: -1 }).lean() });
});
export const createAddress = asyncHandler(async (req, res) => {
  if (req.body.isDefault) await Address.updateMany({ user: req.user._id }, { $set: { isDefault: false } });
  const address = await Address.create({ ...req.body, user: req.user._id });
  res.status(201).json({ address });
});
export const checkout = asyncHandler(async (req, res) => {
  const order = await createCheckout({ customerId: req.user._id, ...req.body });
  res.status(201).json({ order });
});
export const myOrders = asyncHandler(async (req, res) => {
  res.json({ orders: await getCustomerOrders(req.user._id) });
});
export const myOrder = asyncHandler(async (req, res) => {
  res.json({ order: await getOrderForCustomer(req.params.orderId, req.user._id) });
});
export const vendorOrders = asyncHandler(async (req, res) => {
  res.json({ orders: await getVendorOrders(req.user._id) });
});

const transitions = {
  PLACED: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PACKED', 'CANCELLED'],
  PACKED: ['SHIPPED'],
  SHIPPED: ['DELIVERED'],
};

export const updateVendorOrder = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  let updatedOrder;
  try {
    await session.withTransaction(async () => {
      const vendorOrder = await VendorOrder.findOne({ _id: req.params.vendorOrderId, vendor: req.user._id }).session(session);
      if (!vendorOrder) throw new AppError('Order was not found for your store.', 404);
      if (!transitions[vendorOrder.status]?.includes(req.body.status)) {
        throw new AppError(`Order cannot move from ${vendorOrder.status} to ${req.body.status}.`, 409);
      }

      const parent = await Order.findById(vendorOrder.order).session(session);
      if (!parent) throw new AppError('Parent order was not found.', 404);
      if (req.body.status === 'CANCELLED') {
        if (vendorOrder.status !== 'PLACED' || parent.paymentStatus !== 'PENDING') {
          throw new AppError('A seller can cancel only a newly placed, unpaid shipment.', 409);
        }
        for (const item of vendorOrder.items) {
          await Product.updateOne({ _id: item.product }, { $inc: { inventory: item.quantity } }, { session });
        }
        await Commission.updateOne({ vendorOrder: vendorOrder._id }, { $set: { status: 'REVERSED' } }, { session });
      }

      vendorOrder.status = req.body.status;
      vendorOrder.statusHistory.push({ status: req.body.status, changedBy: req.user._id, note: req.body.note || '' });
      await vendorOrder.save({ session });

      const siblings = await VendorOrder.find({ order: parent._id }).select('status').session(session).lean();
      if (siblings.every((item) => item.status === 'CANCELLED')) {
        parent.status = 'CANCELLED';
        parent.statusHistory.push({ status: 'CANCELLED', changedBy: req.user._id, note: 'All seller shipments were cancelled' });
        await parent.save({ session });
      } else if (req.body.status !== 'CANCELLED' && siblings.every((item) => item.status === req.body.status)) {
        parent.status = req.body.status;
        parent.statusHistory.push({ status: req.body.status, changedBy: req.user._id, note: 'All seller shipments updated' });
        await parent.save({ session });
      }
      updatedOrder = vendorOrder;
    });
  } finally {
    await session.endSession();
  }
  res.json({ order: updatedOrder });
});

export const adminOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find().populate('customer', 'name email').sort({ createdAt: -1 }).limit(100).lean();
  res.json({ orders });
});
