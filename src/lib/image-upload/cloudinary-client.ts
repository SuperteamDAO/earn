import { v2 as cloudinary } from 'cloudinary';

import { CLOUDINARY_CONFIG, UPLOAD_CONFIGS } from './config';
import type { ImageSource, SignedUploadParams } from './types';

cloudinary.config({
  cloud_name: CLOUDINARY_CONFIG.cloudName,
  api_key: CLOUDINARY_CONFIG.apiKey,
  api_secret: CLOUDINARY_CONFIG.apiSecret,
});

/**
 * Generates signed upload parameters with proper expiry enforcement
 * The signature includes a timestamp that Cloudinary validates
 */
export function generateSignedUploadParams(
  source: ImageSource,
  publicId?: string,
): SignedUploadParams {
  const config = UPLOAD_CONFIGS[source];
  const timestamp = Math.round(Date.now() / 1000);

  const paramsToSign: Record<string, string | number> = {
    timestamp,
    folder: config.folder,
  };

  if (publicId) {
    paramsToSign.public_id = publicId;
  }

  if (config.eager) {
    paramsToSign.eager = config.eager;
  }

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    CLOUDINARY_CONFIG.apiSecret,
  );

  return {
    signature,
    timestamp,
    cloudName: CLOUDINARY_CONFIG.cloudName,
    apiKey: CLOUDINARY_CONFIG.apiKey,
    folder: config.folder,
    publicId,
    eager: config.eager,
  };
}

export async function deleteImage(publicId: string): Promise<boolean> {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok';
  } catch {
    return false;
  }
}

export function extractPublicIdFromUrl(url: string): string | null {
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

  const transformationPrefixes = [
    'c_',
    'w_',
    'h_',
    'f_',
    'q_',
    'e_',
    'l_',
    'o_',
    'r_',
    'g_',
    'x_',
    'y_',
    'z_',
    'a_',
    'b_',
    'd_',
    'fl_',
    'if_',
  ];

  while (startIndex < segments.length) {
    const segment = segments[startIndex];
    if (!segment) break;

    const isTransformation = transformationPrefixes.some((prefix) =>
      segment.startsWith(prefix),
    );
    if (!isTransformation) break;
    startIndex++;
  }

  const pathWithExt = segments.slice(startIndex).join('/');
  const dot = pathWithExt.lastIndexOf('.');
  return dot === -1 ? pathWithExt : pathWithExt.slice(0, dot);
}
