import type { ImageErrorCode } from './types';

// The Cloudinary SDK rejects with plain objects, not Errors, and nests the
// status under `error` for some API calls.
export function isCloudinaryNotFound(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const { http_code, error: inner } = error as {
    http_code?: unknown;
    error?: { http_code?: unknown };
  };
  return http_code === 404 || inner?.http_code === 404;
}

export class ImageUploadError extends Error {
  public readonly code: ImageErrorCode;

  constructor(code: ImageErrorCode, message: string) {
    super(message);
    this.name = 'ImageUploadError';
    this.code = code;
    Object.setPrototypeOf(this, ImageUploadError.prototype);
  }

  static invalidFormat(message = 'Invalid image format'): ImageUploadError {
    return new ImageUploadError('INVALID_FORMAT', message);
  }

  static invalidMagicBytes(
    message = 'File content does not match declared format',
  ): ImageUploadError {
    return new ImageUploadError('INVALID_MAGIC_BYTES', message);
  }

  static fileTooLarge(maxSize: number): ImageUploadError {
    const maxMB = Math.round(maxSize / (1024 * 1024));
    return new ImageUploadError(
      'FILE_TOO_LARGE',
      `File size exceeds ${maxMB}MB limit`,
    );
  }

  static uploadFailed(message = 'Upload failed'): ImageUploadError {
    return new ImageUploadError('UPLOAD_FAILED', message);
  }

  static rateLimited(
    message = 'Too many upload requests. Please try again later.',
  ): ImageUploadError {
    return new ImageUploadError('RATE_LIMITED', message);
  }

  static unauthorized(
    message = 'You must be logged in to upload images',
  ): ImageUploadError {
    return new ImageUploadError('UNAUTHORIZED', message);
  }

  static invalidRequest(message: string): ImageUploadError {
    return new ImageUploadError('INVALID_REQUEST', message);
  }

  static cloudinaryError(message: string): ImageUploadError {
    return new ImageUploadError('CLOUDINARY_ERROR', message);
  }

  static networkError(
    message = 'Network error occurred during upload',
  ): ImageUploadError {
    return new ImageUploadError('NETWORK_ERROR', message);
  }
}
