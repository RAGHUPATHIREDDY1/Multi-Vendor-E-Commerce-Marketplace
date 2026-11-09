import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  mongoose: {
    connection: {
      readyState: 0,
      asPromise: vi.fn(),
    },
    connect: vi.fn(),
  },
}));

vi.mock('mongoose', () => ({ default: mocks.mongoose }));

import { connectDatabase } from '../src/config/db.js';

describe('database connection setup', () => {
  beforeEach(() => {
    mocks.mongoose.connection.readyState = 0;
    mocks.mongoose.connection.asPromise.mockReset();
    mocks.mongoose.connect.mockReset();
  });

  it('reuses one in-progress connection attempt', async () => {
    mocks.mongoose.connect.mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 5));
      mocks.mongoose.connection.readyState = 1;
      return mocks.mongoose;
    });

    const [first, second] = await Promise.all([connectDatabase(), connectDatabase()]);

    expect(first).toBe(mocks.mongoose);
    expect(second).toBe(mocks.mongoose);
    expect(mocks.mongoose.connect).toHaveBeenCalledTimes(1);
  });

  it('does not reconnect when Mongoose is already connected', async () => {
    mocks.mongoose.connection.readyState = 1;

    await expect(connectDatabase()).resolves.toBe(mocks.mongoose);
    expect(mocks.mongoose.connect).not.toHaveBeenCalled();
  });

  it('does not expose raw connection errors', async () => {
    mocks.mongoose.connect.mockRejectedValue(new Error('Authentication failed for mongodb+srv://secret-user:secret-pass@example.test'));

    await expect(connectDatabase()).rejects.toThrow(
      'MongoDB connection failed. Check the Atlas URI, network access, and database user credentials.'
    );
  });
});
