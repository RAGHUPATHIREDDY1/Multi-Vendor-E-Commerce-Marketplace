import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { requireDatabase } from '../middleware/requireDatabase.js';
import { validate } from '../middleware/validate.js';
import { vendorStatusSchema, createCategorySchema } from '../validators/commerceValidators.js';
import { categoryStatusSchema, userStatusSchema } from '../validators/adminValidators.js';
import { adminOrders } from '../controllers/commerceController.js';
import {
  categories,
  createCategory,
  customers,
  dashboard,
  listAllProducts,
  setCategoryActive,
  updateCustomer,
  updateVendor,
  vendors,
} from '../controllers/adminController.js';

const router = Router();
router.use(requireDatabase, authenticate, authorize('admin'));

router.get('/dashboard', dashboard);
router.get('/vendors', vendors);
router.patch('/vendors/:vendorId/status', validate(vendorStatusSchema), updateVendor);
router.get('/customers', customers);
router.patch('/customers/:userId/status', validate(userStatusSchema), updateCustomer);
router.get('/products', listAllProducts);
router.get('/orders', adminOrders);
router.get('/categories', categories);
router.post('/categories', validate(createCategorySchema), createCategory);
router.patch('/categories/:categoryId/status', validate(categoryStatusSchema), setCategoryActive);

export default router;
