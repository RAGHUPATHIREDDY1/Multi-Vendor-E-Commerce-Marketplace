import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Expected a valid ID');

export const addCartItemSchema = z.object({
  body: z.object({
    productId: objectId,
    quantity: z.number().int().min(1).max(100),
  }).strict(),
});

export const updateCartItemSchema = z.object({
  params: z.object({ productId: objectId }),
  body: z.object({ quantity: z.number().int().min(1).max(100) }).strict(),
});

export const checkoutSchema = z.object({
  body: z.object({
    addressId: objectId,
    couponCode: z.string().trim().max(40).optional(),
  }).strict(),
});

export const addressSchema = z.object({
  body: z.object({
    label: z.string().trim().max(40).optional(),
    recipient: z.string().trim().min(2).max(100),
    phone: z.string().trim().min(5).max(30),
    line1: z.string().trim().min(3).max(160),
    line2: z.string().trim().max(160).optional(),
    city: z.string().trim().min(2).max(80),
    region: z.string().trim().min(2).max(80),
    postalCode: z.string().trim().min(2).max(24),
    country: z.string().trim().min(2).max(80),
    isDefault: z.boolean().optional(),
  }).strict(),
});

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(160),
    description: z.string().trim().min(5).max(5000),
    price: z.number().finite().min(0).multipleOf(0.01),
    category: z.string().trim().min(2).max(80),
    inventory: z.number().int().min(0).max(100000),
    images: z.array(z.string().url()).max(10).optional(),
    sku: z.string().trim().max(64).optional(),
    originalPrice: z.number().finite().min(0).multipleOf(0.01).optional(),
    status: z.enum(['active', 'draft']).optional(),
  }).strict(),
});

export const updateProductSchema = z.object({
  params: z.object({ productId: objectId }),
  body: createProductSchema.shape.body.partial().strict(),
});

export const vendorStatusSchema = z.object({
  params: z.object({ vendorId: objectId }),
  body: z.object({
    approvalStatus: z.enum(['approved', 'rejected', 'suspended']),
    rejectionReason: z.string().trim().max(500).optional(),
  }).strict(),
});

export const vendorOrderStatusSchema = z.object({
  params: z.object({ vendorOrderId: objectId }),
  body: z.object({
    status: z.enum(['CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
    note: z.string().trim().max(300).optional(),
  }).strict(),
});

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(80),
    description: z.string().trim().max(500).optional(),
  }).strict(),
});

export const createCouponSchema = z.object({
  body: z.object({
    code: z.string().trim().min(3).max(40).regex(/^[A-Za-z0-9_-]+$/),
    discountType: z.enum(['percentage', 'fixed']),
    discountValue: z.number().positive(),
    minimumOrderMinor: z.number().int().min(0).optional(),
    maximumDiscountMinor: z.number().int().positive().optional(),
    usageLimit: z.number().int().positive().optional(),
    expiresAt: z.string().datetime(),
    isActive: z.boolean().optional(),
  }).strict().refine((value) => value.discountType !== 'percentage' || value.discountValue <= 100, {
    message: 'Percentage discount cannot exceed 100.',
    path: ['discountValue'],
  }),
});

export const couponStatusSchema = z.object({
  params: z.object({ couponId: objectId }),
  body: z.object({ isActive: z.boolean() }).strict(),
});
