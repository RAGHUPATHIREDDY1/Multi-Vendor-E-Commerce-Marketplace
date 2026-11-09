import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

const uploadsDirectory = fileURLToPath(new URL('../../uploads/', import.meta.url));
const extensions = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

function isValidImage(buffer, type) {
  if (type === 'image/jpeg') return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (type === 'image/png') return buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (type === 'image/webp') return buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
  return false;
}

export async function saveProductImage(file) {
  const extension = extensions[file.mimetype];
  if (!extension || !isValidImage(file.buffer, file.mimetype)) {
    throw new AppError('Upload a valid JPEG, PNG, or WebP image.', 400);
  }
  const key = `products/${randomUUID()}.${extension}`;

  if (env.AWS_REGION && env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY && env.AWS_S3_BUCKET) {
    const client = new S3Client({
      region: env.AWS_REGION,
      credentials: { accessKeyId: env.AWS_ACCESS_KEY_ID, secretAccessKey: env.AWS_SECRET_ACCESS_KEY },
    });
    await client.send(new PutObjectCommand({
      Bucket: env.AWS_S3_BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    }));
    return { url: `https://${env.AWS_S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com/${key}`, storage: 's3' };
  }

  if (env.NODE_ENV === 'production') {
    throw new AppError('S3 image storage is not configured in production.', 503);
  }
  const filename = path.basename(key);
  await mkdir(uploadsDirectory, { recursive: true });
  await writeFile(path.join(uploadsDirectory, filename), file.buffer, { flag: 'wx' });
  return { url: `${env.PUBLIC_API_URL}/uploads/${filename}`, storage: 'local-development' };
}
