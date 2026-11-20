import { v2 as cloudinary } from 'cloudinary';

import { isCloudinaryNotFound } from '@/lib/image-upload/errors';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const DatauriParser = require('datauri/parser');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const csvUpload = async (
  file: { content: string },
  fileName: string,
  listingId: string,
) => {
  const result = await cloudinary.uploader.upload(file.content, {
    public_id: `${fileName}.csv`,
    folder: process.env.CLOUDINARY_SUBMISSIONS_FOLDER,
    resource_type: 'raw',
    type: 'private',
    access_type: 'anonymous',
    tags: [listingId],
  });
  return result;
};

export const str2ab = (str: string, fileName: string) => {
  const buffer = Buffer.from(str, 'utf8');
  const parser = new DatauriParser();
  const file64 = parser.format(fileName, buffer);
  return file64;
};

export const getCloudinaryFetchUrl = (
  url: string | null | undefined,
): string | null => {
  if (!url) return null;
  if (url === 'error') return null;

  if (url.includes('res.cloudinary.com')) return url;

  const encodedUrl = encodeURIComponent(url);

  return `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/fetch/${encodedUrl}`;
};

export const verifyImageExists = async (url: string): Promise<boolean> => {
  try {
    try {
      const { hostname } = new URL(url);
      if (hostname === 'lh3.googleusercontent.com') {
        return true;
      }
    } catch {}

    const publicId = extractPublicIdFromUrl(url);
    if (!publicId) return false;
    await cloudinary.api.resource(publicId, { resource_type: 'image' });
    return true;
  } catch (error) {
    if (isCloudinaryNotFound(error)) {
      return false;
    }
    throw error;
  }
};

const CLOUDINARY_DELIVERY_HOST = 'res.cloudinary.com';

export const convertToJpegUrl = (value: string): string | null => {
  if (!value) return null;

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }

  if (
    url.protocol !== 'https:' ||
    url.hostname !== CLOUDINARY_DELIVERY_HOST ||
    url.port ||
    url.username ||
    url.password
  ) {
    return null;
  }

  const pathSegments = url.pathname.split('/');
  const uploadIndex = pathSegments.indexOf('upload');
  const firstUploadParameter = pathSegments[uploadIndex + 1];

  if (uploadIndex === -1 || !firstUploadParameter) return null;

  const alreadyRequestsJpeg = firstUploadParameter.split(',').includes('f_jpg');

  if (!alreadyRequestsJpeg) {
    pathSegments.splice(uploadIndex + 1, 0, 'f_jpg');
    url.pathname = pathSegments.join('/');
  }

  return url.toString();
};

const extractPublicIdFromUrl = (url: string): string | null => {
  if (!url || !url.includes('res.cloudinary.com')) return null;

  const parts = url.split('/upload/');
  if (parts.length < 2) return null;

  const afterUpload = parts[1];
  if (!afterUpload) return null;
  const segments = afterUpload.split('/');

  let startIndex = 0;
  const versionIndex = segments.findIndex((seg) => {
    if (!seg || seg[0] !== 'v') return false;
    const digits = seg.slice(1);
    if (digits.length === 0) return false;
    for (let i = 0; i < digits.length; i++) {
      const ch = digits[i]!;
      if (ch < '0' || ch > '9') return false;
    }
    return true;
  });
  if (versionIndex !== -1) startIndex = versionIndex + 1;

  const pathWithExt = segments.slice(startIndex).join('/');
  const dot = pathWithExt.lastIndexOf('.');
  return dot === -1 ? pathWithExt : pathWithExt.slice(0, dot);
};
