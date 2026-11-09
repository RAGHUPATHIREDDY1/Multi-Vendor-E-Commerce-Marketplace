import { z } from 'zod';

export const createPaymentSchema = z.object({
  body: z.object({ orderId: z.string().regex(/^[a-f\d]{24}$/i) }).strict(),
});

export const confirmPaymentSchema = z.object({
  body: z.object({
    orderId: z.string().regex(/^[a-f\d]{24}$/i),
    providerOrderId: z.string().min(5).max(100),
    paymentId: z.string().min(5).max(100),
    signature: z.string().regex(/^[a-f\d]{64}$/i),
  }).strict(),
});
