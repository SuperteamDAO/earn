export const GRANT_IMAGE_SOURCES = [
  'grant-event-pictures',
  'grant-event-receipts',
  'grant-agentic-receipts',
] as const;

export const IMAGE_SOURCES = [
  'user',
  'sponsor',
  'description',
  ...GRANT_IMAGE_SOURCES,
] as const;

export type ImageSource = (typeof IMAGE_SOURCES)[number];
export type GrantImageSource = (typeof GRANT_IMAGE_SOURCES)[number];

export function isGrantImageSource(
  source: ImageSource,
): source is GrantImageSource {
  return GRANT_IMAGE_SOURCES.some((grantSource) => grantSource === source);
}
export type ImageFormat = 'jpeg' | 'png' | 'webp';

export interface UploadResult {
  publicId: string;
  secureUrl: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

export interface SignedUploadParams {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  folder: string;
  publicId?: string;
  context?: string;
  eager?: string;
}

export type ImageErrorCode =
  | 'INVALID_FORMAT'
  | 'INVALID_MAGIC_BYTES'
  | 'FILE_TOO_LARGE'
  | 'UPLOAD_FAILED'
  | 'RATE_LIMITED'
  | 'UNAUTHORIZED'
  | 'INVALID_REQUEST'
  | 'CLOUDINARY_ERROR'
  | 'NETWORK_ERROR';

export interface UploadConfig {
  folder: string;
  maxWidth: number;
  maxHeight: number;
  quality: number;
  eager?: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}
