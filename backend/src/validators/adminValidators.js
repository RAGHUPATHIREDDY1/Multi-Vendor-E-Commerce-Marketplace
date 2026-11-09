import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Expected a valid ID');

export const userStatusSchema = z.object({
  params: z.object({ userId: objectId }),
  body: z.object({ isActive: z.boolean() }).strict(),
});

export const categoryStatusSchema = z.object({
  params: z.object({ categoryId: objectId }),
  body: z.object({ isActive: z.boolean() }).strict(),
});
