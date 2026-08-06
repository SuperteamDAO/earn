import sharp from 'sharp';

export const MAX_TOKEN_ICON_SIZE_BYTES = 5 * 1024 * 1024;

const MAX_ICON_PIXELS = 16 * 1024 * 1024;
const MAX_NORMALIZED_ICON_DIMENSION = 1024;

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

const encodeBoundedPng = async (pipeline: sharp.Sharp) => {
  const output = pipeline
    .resize({
      width: MAX_NORMALIZED_ICON_DIMENSION,
      height: MAX_NORMALIZED_ICON_DIMENSION,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .png();
  const chunks: Buffer[] = [];
  let totalBytes = 0;

  for await (const chunk of output) {
    const buffer = Buffer.from(chunk);
    totalBytes += buffer.byteLength;

    if (totalBytes > MAX_TOKEN_ICON_SIZE_BYTES) {
      output.destroy();
      throw new Error('Normalized token icon is too large');
    }

    chunks.push(buffer);
  }

  return Buffer.concat(chunks, totalBytes);
};

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
      image: await encodeBoundedPng(pipeline),
      contentType: 'image/png',
    };
  }

  return { image, contentType: detectedContentType };
};
