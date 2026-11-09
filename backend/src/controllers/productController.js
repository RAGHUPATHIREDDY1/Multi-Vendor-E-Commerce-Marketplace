import { asyncHandler } from '../utils/asyncHandler.js';
import { findActiveProduct, searchProducts } from '../services/productService.js';
import { createVendorProduct, deleteVendorProduct, listVendorProducts, updateVendorProduct } from '../services/vendorProductService.js';

export const listProducts = asyncHandler(async (req, res) => {
  res.json(await searchProducts(req.validatedQuery));
});

export const getProduct = asyncHandler(async (req, res) => {
  const product = await findActiveProduct(req.params.idOrSlug);
  res.json({ product });
});

export const vendorProducts = asyncHandler(async (req, res) => {
  res.json({ products: await listVendorProducts(req.user._id) });
});

export const createProduct = asyncHandler(async (req, res) => {
  const product = await createVendorProduct(req.user._id, req.body);
  res.status(201).json({ product });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await updateVendorProduct(req.user._id, req.params.productId, req.body);
  res.json({ product });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  await deleteVendorProduct(req.user._id, req.params.productId);
  res.status(204).end();
});
