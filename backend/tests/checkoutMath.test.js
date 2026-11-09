import { describe, expect, it } from 'vitest';
import { allocateDiscount, calculateDiscount } from '../src/services/orderService.js';
import { AppError } from '../src/utils/AppError.js';

describe('checkout money calculations', () => {
  it('allocates coupon discounts across sellers without losing minor units', () => {
    const groups = [{ subtotalMinor: 1001 }, { subtotalMinor: 2000 }, { subtotalMinor: 3000 }];
    const allocated = allocateDiscount(groups, 601, 6001);

    expect(allocated.reduce((sum, group) => sum + group.discountMinor, 0)).toBe(601);
    expect(allocated.every((group) => group.discountMinor >= 0)).toBe(true);
  });

  it('caps percentage and fixed coupons at the order subtotal', () => {
    expect(calculateDiscount({ isActive: true, expiresAt: new Date(Date.now() + 60_000), discountType: 'percentage', discountValue: 25, usageCount: 0, minimumOrderMinor: 0 }, 1001)).toBe(250);
    expect(calculateDiscount({ isActive: true, expiresAt: new Date(Date.now() + 60_000), discountType: 'fixed', discountValue: 99, usageCount: 0, minimumOrderMinor: 0 }, 1001)).toBe(1001);
  });

  it('rejects expired or below-minimum coupons', () => {
    expect(() => calculateDiscount({ isActive: false }, 1000)).toThrow(AppError);
    expect(() => calculateDiscount({ isActive: true, expiresAt: new Date(Date.now() - 1000) }, 1000)).toThrow(AppError);
    expect(() => calculateDiscount({ isActive: true, expiresAt: new Date(Date.now() + 1000), minimumOrderMinor: 2000 }, 1000)).toThrow(AppError);
  });
});
