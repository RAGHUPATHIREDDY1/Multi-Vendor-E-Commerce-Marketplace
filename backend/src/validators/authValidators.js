import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(80),
    email: z.string().trim().email().max(254),
    password: z.string().min(8).max(72),
  }).strict(),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email().max(254),
    password: z.string().min(1).max(72),
  }).strict(),
});

export const vendorRegisterSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(80),
    email: z.string().trim().email().max(254),
    password: z.string().min(8).max(72),
    storeName: z.string().trim().min(2).max(120),
    description: z.string().trim().min(10).max(2000),
  }).strict(),
});
