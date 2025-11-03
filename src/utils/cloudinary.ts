import { v2 as cloudinary } from 'cloudinary';
import sharp from 'sharp';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const DatauriParser = require('datauri/parser');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const csvUpload = async (
  file: any,
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

  if (url.includes('res.cloudinary.com')) return url;

  const encodedUrl = encodeURIComponent(url);

  return `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/fetch/${encodedUrl}`;
};

export const uploadImage = async (
  buffer: Buffer,
  folder: string,
  width?: number,
): Promise<string> => {
  const processedImage = await sharp(buffer)
    .resize(width ? { width } : undefined)
    .png({ quality: 80 })
    .toBuffer();

  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ resource_type: 'image', folder }, (error, result) => {
        if (error || !result?.secure_url) {
          reject(new Error('Failed to upload image to Cloudinary.'));
        } else {
          resolve(result.secure_url);
        }
      })
      .end(processedImage);
  });
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
  } catch (error: any) {
    if (error?.http_code === 404 || error?.error?.http_code === 404) {
      return false;
    }
    throw error;
  }
};

export const convertToJpegUrl = (url: string): string | null => {
  if (!url || !url.includes('res.cloudinary.com')) return null;

  if (url.includes('/f_jpg/') || url.includes('f_jpg')) {
    return url;
  }

  const parts = url.split('/upload/');
  if (parts.length < 2) return null;

  const afterUpload = parts[1];
  if (!afterUpload) return null;

  const transformedUrl = url.replace('/upload/', '/upload/f_jpg/');

  return transformedUrl;
};

export const extractPublicIdFromUrl = (url: string): string | null => {
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
