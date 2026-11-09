process.env.NODE_ENV = 'test';
process.env.MONGODB_URI ||= 'mongodb://127.0.0.1:27017/marketplace_test';
process.env.JWT_SECRET ||= 'test-only-secret-that-is-long-enough-for-validation';
