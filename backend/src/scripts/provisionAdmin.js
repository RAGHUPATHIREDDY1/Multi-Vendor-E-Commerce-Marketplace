import { connectDatabase } from '../config/db.js';
import { User } from '../models/User.js';
import mongoose from 'mongoose';

const name = process.env.ADMIN_NAME?.trim();
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;

if (!name || !email || !password || password.length < 12) {
  console.error('Set ADMIN_NAME, ADMIN_EMAIL, and an ADMIN_PASSWORD of at least 12 characters in backend/.env.');
  process.exitCode = 1;
} else {
  try {
    await connectDatabase();
    if (await User.exists({ email })) {
      throw new Error('That account already exists. Admin provisioning does not modify existing accounts.');
    }
    await User.create({ name, email, password, role: 'admin' });
    console.log(`Administrator account created for ${email}.`);
  } catch (error) {
    console.error(`Admin provisioning failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}
