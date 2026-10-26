// Earn's Cloudinary delivery URL turned to JPEG (f_jpg), for OG images:
// the image renderer can't read WebP. null for anything not on Cloudinary.
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
