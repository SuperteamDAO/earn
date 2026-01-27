import type { ImageSource, UploadConfig } from './types';

const isDev = process.env.VERCEL_ENV !== 'production';
const devSuffix = isDev ? '-dev' : '';

export const UPLOAD_CONFIGS: Record<ImageSource, UploadConfig> = {
  user: {
    folder: `earn-pfp${devSuffix}`,
    maxWidth: 400,
    maxHeight: 400,
    quality: 85,
    eager: 'c_fill,w_200,h_200,q_auto,f_webp',
  },
  sponsor: {
    folder: `earn-sponsor${devSuffix}`,
    maxWidth: 800,
    maxHeight: 800,
    quality: 85,
    eager: 'c_limit,w_400,h_400,q_auto,f_webp',
  },
  description: {
    folder: `listing-description${devSuffix}`,
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 85,
    eager: 'c_limit,w_1200,q_auto,f_webp',
  },
  'grant-event-pictures': {
    folder: `grant-event-pictures${devSuffix}`,
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 85,
    eager: 'c_limit,w_1200,q_auto,f_webp',
  },
  'grant-event-receipts': {
    folder: `grant-event-receipts${devSuffix}`,
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 85,
    eager: 'c_limit,w_1200,q_auto,f_webp',
  },
};

export const CLOUDINARY_CONFIG = {
  cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
  apiKey: process.env.CLOUDINARY_API_KEY || '',
  apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  signatureExpiry: 5 * 60,
};

export const RATE_LIMIT_CONFIG = {
  maxRequests: 10,
  windowMs: 60 * 1000,
};
