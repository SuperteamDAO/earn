import sharp from 'sharp';

const MAX_ICON_PIXELS = 16 * 1024 * 1024;

const CONTENT_TYPE_BY_FORMAT = new Map([
  ['gif', 'image/gif'],
  ['heif', 'image/avif'],
  ['jpeg', 'image/jpeg'],
  ['png', 'image/png'],
  ['svg', 'image/svg+xml'],
  ['webp', 'image/webp'],
]);

const normalizeContentType = (contentType: string) =>
  contentType.split(';', 1)[0]?.trim().toLowerCase() || '';

export const sanitizeTokenIcon = async (
  image: Buffer,
  declaredContentType: string,
  options?: { forcePng?: boolean },
) => {
  const pipeline = sharp(image, {
    failOn: 'error',
    limitInputPixels: MAX_ICON_PIXELS,
  });
  const metadata = await pipeline.metadata();
  const detectedContentType = metadata.format
    ? CONTENT_TYPE_BY_FORMAT.get(metadata.format)
    : undefined;

  if (!detectedContentType) {
    throw new Error('Unsupported token icon format');
  }

  const normalizedDeclaredContentType =
    normalizeContentType(declaredContentType);
  const shouldRasterize =
    options?.forcePng ||
    metadata.format === 'svg' ||
    normalizedDeclaredContentType !== detectedContentType;

  if (shouldRasterize) {
    return {
      image: await pipeline.png().toBuffer(),
      contentType: 'image/png',
    };
  }

  return { image, contentType: detectedContentType };
};
