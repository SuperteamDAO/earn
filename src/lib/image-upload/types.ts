export type ImageSource =
  | 'user'
  | 'sponsor'
  | 'description'
  | 'grant-event-pictures'
  | 'grant-event-receipts';
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
