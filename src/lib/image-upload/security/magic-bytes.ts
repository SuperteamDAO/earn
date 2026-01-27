import type { ImageFormat } from '../types';

const SIGNATURES = {
  jpeg: [0xff, 0xd8, 0xff],
  png: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  webp: {
    riff: [0x52, 0x49, 0x46, 0x46],
    webp: [0x57, 0x45, 0x42, 0x50],
  },
} as const;

function matchesSignature(bytes: Uint8Array, signature: number[]): boolean {
  if (bytes.length < signature.length) return false;
  for (let i = 0; i < signature.length; i++) {
    if (bytes[i] !== signature[i]) return false;
  }
  return true;
}

function isJpeg(bytes: Uint8Array): boolean {
  return matchesSignature(bytes, [...SIGNATURES.jpeg]);
}

function isPng(bytes: Uint8Array): boolean {
  return matchesSignature(bytes, [...SIGNATURES.png]);
}

function isWebp(bytes: Uint8Array): boolean {
  if (bytes.length < 12) return false;
  const hasRiff = matchesSignature(bytes, [...SIGNATURES.webp.riff]);
  const hasWebp = matchesSignature(bytes.slice(8, 12) as Uint8Array, [
    ...SIGNATURES.webp.webp,
  ]);
  return hasRiff && hasWebp;
}

export function detectFormat(buffer: ArrayBuffer): ImageFormat | null {
  const bytes = new Uint8Array(buffer.slice(0, 12));

  if (isJpeg(bytes)) return 'jpeg';
  if (isPng(bytes)) return 'png';
  if (isWebp(bytes)) return 'webp';

  return null;
}

interface ValidationResult {
  valid: boolean;
  detectedFormat: ImageFormat | null;
  error?: string;
}

export function validateImageBuffer(
  buffer: ArrayBuffer,
  declaredMimeType: string,
): ValidationResult {
  const mimeToFormat: Record<string, ImageFormat> = {
    'image/jpeg': 'jpeg',
    'image/png': 'png',
    'image/webp': 'webp',
  };

  const expectedFormat = mimeToFormat[declaredMimeType];
  if (!expectedFormat) {
    return {
      valid: false,
      detectedFormat: null,
      error: `Unsupported MIME type: ${declaredMimeType}`,
    };
  }

  const detectedFormat = detectFormat(buffer);
  if (!detectedFormat) {
    return {
      valid: false,
      detectedFormat: null,
      error: 'Could not detect image format from file content',
    };
  }

  if (detectedFormat !== expectedFormat) {
    return {
      valid: false,
      detectedFormat,
      error: `Declared format (${declaredMimeType}) does not match actual content (${detectedFormat})`,
    };
  }

  return { valid: true, detectedFormat };
}
