import { useState } from 'react';

import { api } from '@/lib/api';
import type { ImageSource } from '@/utils/image';

interface UploadOptions {
  folder: string;
  public_id?: string;
  resource_type?: 'image' | 'video' | 'raw' | 'auto';
  source: ImageSource;
}

interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  url: string;
  format: string;
  width?: number;
  height?: number;
  bytes: number;
  created_at: string;
}

interface UseUploadReturn {
  uploadFile: (
    file: File,
    options: UploadOptions,
  ) => Promise<CloudinaryUploadResult>;
  uploadAndReplace: (
    file: File,
    options: UploadOptions,
    oldImageUrl?: string,
  ) => Promise<CloudinaryUploadResult>;
  uploading: boolean;
  progress: number;
  error: string | null;
}

export const useUploadImage = (): UseUploadReturn => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        try {
          let { width, height } = img;

          const MAX_DIMENSION = 1920;
          if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
            if (width > height) {
              height = (height * MAX_DIMENSION) / width;
              width = MAX_DIMENSION;
            } else {
              width = (width * MAX_DIMENSION) / height;
              height = MAX_DIMENSION;
            }
          }

          canvas.width = width;
          canvas.height = height;

          ctx?.drawImage(img, 0, 0, width, height);

          const outputFormat = 'image/webp';
          const quality = 0.8;

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const extension = outputFormat.split('/')[1];
                const originalName = file.name.replace(/\.[^/.]+$/, '');
                const newFileName = `${originalName}.${extension}`;

                const compressedFile = new File([blob], newFileName, {
                  type: outputFormat,
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                reject(new Error('Failed to compress image'));
              }
            },
            outputFormat,
            quality,
          );
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  const uploadFile = async (
    file: File,
    options: UploadOptions,
  ): Promise<CloudinaryUploadResult> => {
    if (!file) {
      throw new Error('No file provided');
    }

    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
      if (file.size > MAX_FILE_SIZE) {
        throw new Error(
          `File size cannot exceed ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
        );
      }

      let compressedFile: File;
      try {
        compressedFile = await compressImage(file);
        setProgress(25);
      } catch (compressionError) {
        console.warn(
          'Image compression failed, using original file:',
          compressionError,
        );
        compressedFile = file;
        setProgress(25);
      }

      setProgress(50);

      const signatureResponse = await api.post('/api/image/sign', {
        folder: options.folder,
        public_id: options.public_id,
        resource_type: options.resource_type || 'auto',
        file_size: compressedFile.size,
        source: options.source,
      });

      const signatureData = signatureResponse.data;
      setProgress(75);

      const formData = new FormData();
      formData.append('file', compressedFile);
      formData.append('signature', signatureData.signature);
      formData.append('timestamp', signatureData.timestamp.toString());
      formData.append('folder', signatureData.folder);
      formData.append(
        'api_key',
        process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || '',
      );

      if (signatureData.resourceType) {
        formData.append('resource_type', signatureData.resourceType);
      }

      if (signatureData.publicId) {
        formData.append('public_id', signatureData.publicId);
      }

      const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
        },
      );

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error?.message || 'Upload failed');
      }

      const result: CloudinaryUploadResult = await uploadResponse.json();

      setProgress(100);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      console.error('Upload error:', err);
      throw err;
    } finally {
      setUploading(false);
    }
  };

  const uploadAndReplace = async (
    file: File,
    options: UploadOptions,
    oldImageUrl?: string,
  ): Promise<CloudinaryUploadResult> => {
    if (oldImageUrl && oldImageUrl.includes('res.cloudinary.com')) {
      try {
        await api.delete('/api/image/delete', {
          data: { imageUrl: oldImageUrl, source: options.source },
        });
      } catch (deleteError) {
        console.warn('Failed to delete old image:', deleteError);
      }
    }
    const uploadResult = await uploadFile(file, options);

    return uploadResult;
  };

  return { uploadFile, uploadAndReplace, uploading, progress, error };
};
