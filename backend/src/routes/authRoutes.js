import { Router } from 'express';
import { getCurrentUser, login, register, registerVendor } from '../controllers/authController.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireDatabase } from '../middleware/requireDatabase.js';
import { validate } from '../middleware/validate.js';
import { loginSchema, registerSchema, vendorRegisterSchema } from '../validators/authValidators.js';
import { rateLimit } from 'express-rate-limit';

const router = Router();
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many sign-in attempts. Please try again in a few minutes.' },
});

router.post('/register', authLimiter, validate(registerSchema), requireDatabase, register);
router.post('/vendor/register', authLimiter, validate(vendorRegisterSchema), requireDatabase, registerVendor);
router.post('/login', authLimiter, validate(loginSchema), requireDatabase, login);
router.get('/me', requireDatabase, authenticate, getCurrentUser);

export default router;
