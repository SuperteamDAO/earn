export { UPLOAD_CONFIGS } from './config';
export { ImageUploadError } from './errors';
export { MAX_FILE_SIZE } from './schemas';
export { detectFormat, validateImageBuffer } from './security/magic-bytes';
export type {
  ImageSource,
  SignedUploadParams,
  UploadProgress,
  UploadResult,
} from './types';
export { compressImage } from './utils/compression';

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
    'ar_',
    'bo_',
    'co_',
    'dpr_',
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
