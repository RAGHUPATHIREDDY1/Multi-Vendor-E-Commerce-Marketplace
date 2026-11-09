import { Commission } from '../models/Commission.js';
import { Payment } from '../models/Payment.js';
import { createProviderOrder, handleVerifiedWebhook, verifyAndCapturePayment, verifyWebhookSignature } from '../services/paymentService.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const createPayment = asyncHandler(async (req, res) => {
  res.status(201).json({ payment: await createProviderOrder(req.body.orderId, req.user._id) });
});

export const confirmPayment = asyncHandler(async (req, res) => {
  res.json({ success: true, payment: await verifyAndCapturePayment({ ...req.body, customerId: req.user._id }) });
});

export const webhook = asyncHandler(async (req, res) => {
  if (!verifyWebhookSignature(req.body, req.headers['x-razorpay-signature'])) {
    throw new AppError('Webhook signature could not be verified.', 400);
  }
  let event;
  try {
    event = JSON.parse(req.body.toString('utf8'));
  } catch {
    throw new AppError('Webhook body is not valid JSON.', 400);
  }
  const result = await handleVerifiedWebhook(event);
  res.json({ received: true, ...result });
});

export const myCommissions = asyncHandler(async (req, res) => {
  const commissions = await Commission.find({ vendor: req.user._id }).populate('order', 'orderNumber createdAt').sort({ createdAt: -1 }).lean();
  res.json({ commissions });
});

export const adminPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find().populate({ path: 'order', select: 'orderNumber customer totalMinor paymentStatus', populate: { path: 'customer', select: 'name email' } }).sort({ createdAt: -1 }).limit(200).lean();
  res.json({ payments });
});

export const adminCommissions = asyncHandler(async (req, res) => {
  const commissions = await Commission.find().populate('vendor', 'name email').populate('order', 'orderNumber createdAt').sort({ createdAt: -1 }).limit(500).lean();
  res.json({ commissions });
});
