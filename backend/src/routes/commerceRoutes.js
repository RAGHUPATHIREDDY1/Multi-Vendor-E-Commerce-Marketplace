import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { requireDatabase } from '../middleware/requireDatabase.js';
import { requireApprovedVendor } from '../middleware/requireApprovedVendor.js';
import { validate } from '../middleware/validate.js';
import {
  addCartItemSchema,
  addressSchema,
  checkoutSchema,
  updateCartItemSchema,
  vendorOrderStatusSchema,
} from '../validators/commerceValidators.js';
import { downloadInvoice } from '../controllers/invoiceController.js';
import {
  addItem,
  adminOrders,
  checkout,
  createAddress,
  listAddresses,
  myOrder,
  myOrders,
  readCart,
  removeItem,
  updateItem,
  updateVendorOrder,
  vendorOrders,
} from '../controllers/commerceController.js';

const router = Router();

router.use('/cart', requireDatabase, authenticate);
router.use('/addresses', requireDatabase, authenticate);
router.use('/checkout', requireDatabase, authenticate);
router.use('/orders', requireDatabase, authenticate);
router.use('/vendor', requireDatabase, authenticate);
router.use('/admin', requireDatabase, authenticate);
router.get('/cart', authorize('customer'), readCart);
router.post('/cart/items', authorize('customer'), validate(addCartItemSchema), addItem);
router.patch('/cart/items/:productId', authorize('customer'), validate(updateCartItemSchema), updateItem);
router.delete('/cart/items/:productId', authorize('customer'), removeItem);
router.get('/addresses', authorize('customer'), listAddresses);
router.post('/addresses', authorize('customer'), validate(addressSchema), createAddress);
router.post('/checkout', authorize('customer'), validate(checkoutSchema), checkout);
router.get('/orders', authorize('customer'), myOrders);
router.get('/orders/:orderId/invoice', authorize('customer'), downloadInvoice);
router.get('/orders/:orderId', authorize('customer'), myOrder);
router.get('/vendor/orders', authorize('vendor'), requireApprovedVendor, vendorOrders);
router.patch('/vendor/orders/:vendorOrderId/status', authorize('vendor'), requireApprovedVendor, validate(vendorOrderStatusSchema), updateVendorOrder);
router.get('/admin/orders', authorize('admin'), adminOrders);

export default router;
