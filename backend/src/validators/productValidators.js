import { z } from 'zod';

export const productQuerySchema = z.object({
  query: z.object({
    q: z.string().trim().max(100).optional(),
    category: z.string().trim().max(80).optional(),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    sort: z.enum(['newest', 'price_asc', 'price_desc']).default('newest'),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(48).default(12),
  }).strict(),
});
