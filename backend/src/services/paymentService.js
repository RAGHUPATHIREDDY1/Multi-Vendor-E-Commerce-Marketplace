import crypto from 'node:crypto';
import Razorpay from 'razorpay';
import mongoose from 'mongoose';
import { Commission } from '../models/Commission.js';
import { Order } from '../models/Order.js';
import { Payment } from '../models/Payment.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

let razorpayClient;

function getRazorpayClient() {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    throw new AppError('Razorpay test credentials are not configured on the backend.', 503);
  }
  razorpayClient ||= new Razorpay({ key_id: env.RAZORPAY_KEY_ID, key_secret: env.RAZORPAY_KEY_SECRET });
  return razorpayClient;
}

export function verifyPaymentSignature(orderId, paymentId, signature, secret = env.RAZORPAY_KEY_SECRET) {
  const expected = crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest();
  if (typeof signature !== 'string' || !/^[a-f\d]{64}$/i.test(signature)) return false;
  const actual = Buffer.from(signature, 'hex');
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

export function verifyWebhookSignature(rawBody, signature, secret = env.RAZORPAY_WEBHOOK_SECRET) {
  if (!secret || !Buffer.isBuffer(rawBody) || typeof signature !== 'string' || !/^[a-f\d]{64}$/i.test(signature)) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest();
  const actual = Buffer.from(signature, 'hex');
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

export async function createProviderOrder(orderId, customerId) {
  const order = await Order.findOne({ _id: orderId, customer: customerId });
  if (!order) throw new AppError('Order was not found.', 404);
  if (order.paymentStatus !== 'PENDING') throw new AppError('This order is not awaiting payment.', 409);

  const razorpay = getRazorpayClient();
  const existingPayment = await Payment.findOne({ order: order._id });
  if (existingPayment?.status === 'CREATED' && existingPayment.providerOrderId) {
    return {
      keyId: env.RAZORPAY_KEY_ID,
      providerOrderId: existingPayment.providerOrderId,
      amount: existingPayment.amountMinor,
      currency: existingPayment.currency,
      orderNumber: order.orderNumber,
    };
  }

  const providerOrder = await razorpay.orders.create({
    amount: order.totalMinor,
    currency: 'INR',
    receipt: order.orderNumber.slice(0, 40),
    notes: { marketplaceOrderId: order._id.toString() },
  });
  await Payment.findOneAndUpdate(
    { order: order._id },
    { $set: { provider: 'razorpay', providerOrderId: providerOrder.id, amountMinor: order.totalMinor, currency: providerOrder.currency, status: 'CREATED', signatureVerified: false } },
    { upsert: true, new: true, runValidators: true },
  );
  return { keyId: env.RAZORPAY_KEY_ID, providerOrderId: providerOrder.id, amount: providerOrder.amount, currency: providerOrder.currency, orderNumber: order.orderNumber };
}

async function finalizePayment({ providerOrderId, paymentId }) {
  const payment = await Payment.findOne({ providerOrderId });
  if (!payment) throw new AppError('Payment order was not found.', 404);
  if (payment.status === 'CAPTURED') return { alreadyProcessed: true, orderId: payment.order };

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const currentPayment = await Payment.findById(payment._id).session(session);
      if (currentPayment.status === 'CAPTURED') return;
      const order = await Order.findOneAndUpdate(
        { _id: currentPayment.order, paymentStatus: 'PENDING' },
        { $set: { paymentStatus: 'PAID' } },
        { new: true, session },
      );
      if (!order) throw new AppError('The order is no longer awaiting payment.', 409);
      currentPayment.status = 'CAPTURED';
      currentPayment.providerPaymentId = paymentId;
      currentPayment.signatureVerified = true;
      await currentPayment.save({ session });
      await Commission.updateMany({ order: order._id }, { $set: { status: 'EARNED' } }, { session });
    });
  } finally {
    await session.endSession();
  }
  return { alreadyProcessed: false, orderId: payment.order };
}

export async function verifyAndCapturePayment({ orderId, customerId, providerOrderId, paymentId, signature }) {
  const paymentRecord = await Payment.findOne({ providerOrderId, order: orderId });
  if (!paymentRecord) throw new AppError('Payment order does not match this order.', 400);
  const order = await Order.findOne({ _id: orderId, customer: customerId });
  if (!order) throw new AppError('Order was not found.', 404);
  if (!verifyPaymentSignature(providerOrderId, paymentId, signature)) throw new AppError('Payment signature could not be verified.', 400);

  const details = await getRazorpayClient().payments.fetch(paymentId);
  if (details.order_id !== providerOrderId || details.amount !== paymentRecord.amountMinor || details.currency !== paymentRecord.currency || details.status !== 'captured') {
    throw new AppError('The provider has not confirmed a captured payment for this order.', 409);
  }
  return finalizePayment({ providerOrderId, paymentId });
}

export async function handleVerifiedWebhook(event) {
  const paymentEntity = event.payload?.payment?.entity;
  if (!paymentEntity?.order_id || !paymentEntity?.id) return { ignored: true };
  const payment = await Payment.findOne({ providerOrderId: paymentEntity.order_id });
  if (!payment || payment.amountMinor !== paymentEntity.amount || payment.currency !== paymentEntity.currency) {
    throw new AppError('Webhook payment does not match a marketplace payment.', 400);
  }
  if (event.event === 'payment.failed') {
    if (payment.status !== 'CAPTURED') {
      payment.status = 'FAILED';
      payment.providerPaymentId = paymentEntity.id;
      await payment.save();
    }
    return { failed: true };
  }
  if (event.event !== 'payment.captured') return { ignored: true };
  return finalizePayment({ providerOrderId: paymentEntity.order_id, paymentId: paymentEntity.id });
}
