import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import { saveProductImage } from '../services/storageService.js';

export const uploadProductImage = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError('Choose an image file to upload.', 400);
  res.status(201).json({ image: await saveProductImage(req.file) });
});
