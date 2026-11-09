import crypto from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { verifyPaymentSignature, verifyWebhookSignature } from '../src/services/paymentService.js';

describe('payment signature verification', () => {
  it('accepts a correct Razorpay payment signature only', () => {
    const secret = 'test-secret';
    const input = 'order_123|pay_456';
    const signature = crypto.createHmac('sha256', secret).update(input).digest('hex');

    expect(verifyPaymentSignature('order_123', 'pay_456', signature, secret)).toBe(true);
    expect(verifyPaymentSignature('order_123', 'pay_456', 'not-a-signature', secret)).toBe(false);
    expect(verifyPaymentSignature('other_order', 'pay_456', signature, secret)).toBe(false);
  });

  it('verifies a webhook against its raw request bytes', () => {
    const secret = 'webhook-secret';
    const body = Buffer.from('{"event":"payment.captured"}');
    const signature = crypto.createHmac('sha256', secret).update(body).digest('hex');

    expect(verifyWebhookSignature(body, signature, secret)).toBe(true);
    expect(verifyWebhookSignature(Buffer.from('different body'), signature, secret)).toBe(false);
    expect(verifyWebhookSignature(body, signature, '')).toBe(false);
  });
});
