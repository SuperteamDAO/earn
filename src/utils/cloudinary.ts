import { v2 as cloudinary } from 'cloudinary';
import sharp from 'sharp';

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

export const ALLOWED_IMAGE_FORMATS = ['jpeg', 'png', 'webp'] as const;

export const resolveCloudinaryFolder = (folder: string): string => {
  const isDev = process.env.VERCEL_ENV !== 'production';
  return isDev ? `${folder}-dev` : folder;
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

export const deleteImage = async (imageUrl: string) => {
  if (!imageUrl.includes('res.cloudinary.com')) return;
  const publicId = imageUrl.split('/').slice(-2).join('/').split('.')[0];
  if (!publicId) return;

  await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
};

export const parseDataUrlToBuffer = (dataUrl: string): Buffer | null => {
  if (!dataUrl.startsWith('data:image')) return null;
  const base64 = dataUrl.split(',')[1];
  if (!base64) return null;
  return Buffer.from(base64, 'base64');
};

export const validateImageBufferOrThrow = async (
  buffer: Buffer,
): Promise<void> => {
  const metadata = await sharp(buffer).metadata();
  if (
    !metadata.format ||
    !ALLOWED_IMAGE_FORMATS.includes(metadata.format as any)
  ) {
    throw new Error(
      `Invalid image format. Allowed: ${ALLOWED_IMAGE_FORMATS.map(
        (f) => `image/${f}`,
      ).join(', ')}`,
    );
  }
};

export const uploadBase64ToCloudinary = async (
  dataUrl: string,
  baseFolder: string,
  width?: number,
): Promise<string> => {
  const buffer = parseDataUrlToBuffer(dataUrl);
  if (!buffer) throw new Error('Invalid image data');
  await validateImageBufferOrThrow(buffer);
  const folder = resolveCloudinaryFolder(baseFolder);
  return uploadImage(buffer, folder, width);
};

export const maybeUploadBase64AndDeletePrevious = async (
  value: string | undefined,
  baseFolder: string,
  previousUrl?: string | null,
  width?: number,
): Promise<string | undefined> => {
  if (!value || !value.startsWith('data:image')) return value;
  const newUrl = await uploadBase64ToCloudinary(value, baseFolder, width);
  if (previousUrl) {
    await deleteImage(previousUrl);
  }
  return newUrl;
};

export const verifyImageExists = async (url: string): Promise<boolean> => {
  try {
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
