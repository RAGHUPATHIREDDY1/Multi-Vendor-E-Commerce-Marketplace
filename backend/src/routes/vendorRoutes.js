import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { requireDatabase } from '../middleware/requireDatabase.js';
import { requireApprovedVendor } from '../middleware/requireApprovedVendor.js';
import { getVendorAnalytics, getVendorProfile } from '../services/vendorService.js';
import { validate } from '../middleware/validate.js';
import { createProductSchema, updateProductSchema } from '../validators/commerceValidators.js';
import { createProduct, deleteProduct, updateProduct, vendorProducts } from '../controllers/productController.js';
import { vendorOrders } from '../controllers/commerceController.js';
import { myCommissions } from '../controllers/paymentController.js';
import { uploadProductImage } from '../controllers/uploadController.js';
import multer from 'multer';
import { AppError } from '../utils/AppError.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter(req, file, callback) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      callback(new AppError('Only JPEG, PNG, and WebP images are allowed.', 400));
      return;
    }
    callback(null, true);
  },
});
router.use(requireDatabase, authenticate, authorize('vendor'));

router.get('/me', asyncHandler(async (req, res) => {
  res.json({ vendor: await getVendorProfile(req.user._id) });
}));
router.get('/products', requireApprovedVendor, vendorProducts);
router.post('/products', requireApprovedVendor, validate(createProductSchema), createProduct);
router.patch('/products/:productId', requireApprovedVendor, validate(updateProductSchema), updateProduct);
router.delete('/products/:productId', requireApprovedVendor, deleteProduct);
router.get('/orders', requireApprovedVendor, vendorOrders);
router.get('/analytics', requireApprovedVendor, asyncHandler(async (req, res) => {
  res.json({ analytics: await getVendorAnalytics(req.user._id) });
}));
router.get('/commissions', requireApprovedVendor, myCommissions);
router.post('/uploads', requireApprovedVendor, upload.single('image'), uploadProductImage);

export default router;
