import { describe, expect, it, vi } from 'vitest';
import { loginSchema, registerSchema } from '../src/validators/authValidators.js';
import { authorize } from '../src/middleware/authorize.js';
import { AppError } from '../src/utils/AppError.js';

describe('authentication request validation', () => {
  it('accepts a valid customer registration', () => {
    const result = registerSchema.safeParse({
      body: { name: 'Sam Example', email: 'sam@example.com', password: 'a-safe-password' },
    });

    expect(result.success).toBe(true);
  });

  it('rejects short passwords and attempts to choose a privileged role', () => {
    const shortPassword = registerSchema.safeParse({
      body: { name: 'Sam Example', email: 'sam@example.com', password: 'short' },
    });
    const privilegedRole = registerSchema.safeParse({
      body: { name: 'Sam Example', email: 'sam@example.com', password: 'a-safe-password', role: 'admin' },
    });

    expect(shortPassword.success).toBe(false);
    expect(privilegedRole.success).toBe(false);
  });

  it('requires an email and password when signing in', () => {
    expect(loginSchema.safeParse({ body: { email: 'not-an-email', password: 'pass' } }).success).toBe(false);
  });
});

describe('role authorization', () => {
  it('allows a request from an authorized role', () => {
    const next = vi.fn();
    authorize('admin')({ user: { role: 'admin' } }, {}, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('denies a request from a different role', () => {
    const next = vi.fn();
    authorize('admin')({ user: { role: 'customer' } }, {}, next);
    expect(next.mock.calls[0][0]).toBeInstanceOf(AppError);
    expect(next.mock.calls[0][0].statusCode).toBe(403);
  });
});
