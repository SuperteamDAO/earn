import { useState } from 'react';

import { api } from '@/lib/api';

interface UploadOptions {
  folder: string;
  public_id?: string;
  resource_type?: 'image' | 'video' | 'raw' | 'auto';
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

      const signatureResponse = await fetch('/api/image/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folder: options.folder,
          public_id: options.public_id,
          resource_type: options.resource_type || 'auto',
          file_size: file.size,
        }),
      });

      if (!signatureResponse.ok) {
        const errorData = await signatureResponse.json();
        throw new Error(errorData.error || 'Failed to get upload signature');
      }

      const signatureData = await signatureResponse.json();

      const formData = new FormData();
      formData.append('file', file);
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
    const uploadResult = await uploadFile(file, options);

    if (uploadResult && oldImageUrl) {
      try {
        await api.delete('/api/image/delete', {
          data: { imageUrl: oldImageUrl },
        });
      } catch (deleteError) {
        console.warn('Failed to delete old image:', deleteError);
      }
    }

    return uploadResult;
  };

  return { uploadFile, uploadAndReplace, uploading, progress, error };
};
