'use client';

import { useCallback, useState } from 'react';

import { api } from '@/lib/api';
import {
  compressImage,
  detectFormat,
  extractPublicIdFromUrl,
  type ImageSource,
  ImageUploadError,
  MAX_FILE_SIZE,
  type SignedUploadParams,
  UPLOAD_CONFIGS,
  type UploadProgress,
  type UploadResult,
  validateImageBuffer,
} from '@/lib/image-upload/client';

interface UseImageUploadOptions {
  source: ImageSource;
  onProgress?: (progress: UploadProgress) => void;
  onError?: (error: ImageUploadError) => void;
}

interface UseImageUploadReturn {
  upload: (file: File) => Promise<UploadResult>;
  uploadAndReplace: (file: File, oldImageUrl?: string) => Promise<UploadResult>;
  deleteImage: (imageUrl: string) => Promise<void>;
  uploading: boolean;
  progress: number;
  error: ImageUploadError | null;
  reset: () => void;
}

export function useImageUpload({
  source,
  onProgress,
  onError,
}: UseImageUploadOptions): UseImageUploadReturn {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<ImageUploadError | null>(null);

  const updateProgress = useCallback(
    (loaded: number, total: number) => {
      const percentage = Math.round((loaded / total) * 100);
      setProgress(percentage);
      onProgress?.({ loaded, total, percentage });
    },
    [onProgress],
  );

  const handleError = useCallback(
    (err: ImageUploadError) => {
      setError(err);
      onError?.(err);
    },
    [onError],
  );

  const reset = useCallback(() => {
    setUploading(false);
    setProgress(0);
    setError(null);
  }, []);

  const upload = useCallback(
    async (file: File): Promise<UploadResult> => {
      reset();
      setUploading(true);

      try {
        if (file.size > MAX_FILE_SIZE) {
          throw ImageUploadError.fileTooLarge(MAX_FILE_SIZE);
        }

        updateProgress(0, 100);

        const buffer = await file.arrayBuffer();
        const validation = validateImageBuffer(buffer, file.type);

        if (!validation.valid) {
          throw ImageUploadError.invalidMagicBytes(validation.error);
        }

        updateProgress(10, 100);

        const config = UPLOAD_CONFIGS[source];
        let processedFile: File;

        try {
          processedFile = await compressImage(file, {
            maxWidth: config.maxWidth,
            maxHeight: config.maxHeight,
            quality: config.quality / 100,
            format: 'image/webp',
          });
        } catch {
          processedFile = file;
        }

        updateProgress(30, 100);

        const processedBuffer = await processedFile.arrayBuffer();
        const detectedFormat = detectFormat(processedBuffer);

        if (!detectedFormat) {
          throw ImageUploadError.invalidFormat(
            'Failed to detect format after compression',
          );
        }

        const mimeType = `image/${detectedFormat}` as
          | 'image/jpeg'
          | 'image/png'
          | 'image/webp';

        updateProgress(40, 100);

        const signResponse = await api.post<SignedUploadParams>(
          '/api/image/sign',
          {
            source,
            contentType: mimeType,
            contentLength: processedFile.size,
          },
        );

        const signedParams = signResponse.data;

        updateProgress(50, 100);

        const formData = new FormData();
        formData.append('file', processedFile);
        formData.append('signature', signedParams.signature);
        formData.append('timestamp', signedParams.timestamp.toString());
        formData.append('folder', signedParams.folder);
        formData.append('api_key', signedParams.apiKey);

        if (signedParams.publicId) {
          formData.append('public_id', signedParams.publicId);
        }

        if (signedParams.eager) {
          formData.append('eager', signedParams.eager);
        }

        const uploadUrl = `https://api.cloudinary.com/v1_1/${signedParams.cloudName}/image/upload`;

        const xhr = new XMLHttpRequest();

        const cloudinaryResponse = await new Promise<{
          public_id: string;
          secure_url: string;
          width: number;
          height: number;
          format: string;
          bytes: number;
        }>((resolve, reject) => {
          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              const uploadProgress = 50 + (event.loaded / event.total) * 50;
              updateProgress(uploadProgress, 100);
            }
          });

          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const response = JSON.parse(xhr.responseText);
                resolve(response);
              } catch {
                reject(
                  ImageUploadError.uploadFailed('Invalid response format'),
                );
              }
            } else {
              try {
                const errorResponse = JSON.parse(xhr.responseText);
                reject(
                  ImageUploadError.cloudinaryError(
                    errorResponse.error?.message || 'Upload failed',
                  ),
                );
              } catch {
                reject(ImageUploadError.uploadFailed(`HTTP ${xhr.status}`));
              }
            }
          });

          xhr.addEventListener('error', () => {
            reject(ImageUploadError.networkError());
          });

          xhr.addEventListener('abort', () => {
            reject(ImageUploadError.uploadFailed('Upload aborted'));
          });

          xhr.open('POST', uploadUrl);
          xhr.send(formData);
        });

        updateProgress(100, 100);

        return {
          publicId: cloudinaryResponse.public_id,
          secureUrl: cloudinaryResponse.secure_url,
          width: cloudinaryResponse.width,
          height: cloudinaryResponse.height,
          format: cloudinaryResponse.format,
          bytes: cloudinaryResponse.bytes,
        };
      } catch (err) {
        const uploadError =
          err instanceof ImageUploadError
            ? err
            : ImageUploadError.uploadFailed(
                err instanceof Error ? err.message : 'Unknown error',
              );
        handleError(uploadError);
        throw uploadError;
      } finally {
        setUploading(false);
      }
    },
    [source, updateProgress, handleError, reset],
  );

  const deleteImageFn = useCallback(
    async (imageUrl: string): Promise<void> => {
      const publicId = extractPublicIdFromUrl(imageUrl);
      if (!publicId) {
        return;
      }

      try {
        await api.delete('/api/image/delete', {
          data: { publicId, source },
        });
      } catch (err) {
        console.warn('Failed to delete old image:', err);
      }
    },
    [source],
  );

  const uploadAndReplace = useCallback(
    async (file: File, oldImageUrl?: string): Promise<UploadResult> => {
      const result = await upload(file);

      if (oldImageUrl && oldImageUrl.includes('res.cloudinary.com')) {
        deleteImageFn(oldImageUrl).catch(() => {});
      }

      return result;
    },
    [upload, deleteImageFn],
  );

  return {
    upload,
    uploadAndReplace,
    deleteImage: deleteImageFn,
    uploading,
    progress,
    error,
    reset,
  };
}
