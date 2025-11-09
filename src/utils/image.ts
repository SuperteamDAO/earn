import { api } from '@/lib/api';
import logger from '@/lib/logger';

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (reader.result !== null) {
        resolve(reader.result as string);
      } else {
        reject(new Error('FileReader result is null'));
      }
    };
    reader.onerror = (error) => reject(error);
  });
}

export const IMAGE_SOURCE = {
  DESCRIPTION: 'description',
  USER: 'user',
  SPONSOR: 'sponsor',
} as const;

export type ImageSource = (typeof IMAGE_SOURCE)[keyof typeof IMAGE_SOURCE];

export type EARN_IMAGE_FOLDER =
  | 'earn-pfp'
  | 'earn-sponsor'
  | 'listing-description';

async function uploadToCld(
  file: File,
  folder: EARN_IMAGE_FOLDER,
  source: ImageSource = IMAGE_SOURCE.USER,
) {
  try {
    const base64Image = await fileToBase64(file);
    const base64Content = base64Image.split(',')[1];

    const response = await api.post('/api/image/upload', {
      imageBase64: base64Content,
      source,
      folder,
    });

    return response.data.url;
  } catch (error) {
    logger.error('Error uploading image to Cloudinary:', error);
    throw new Error('Failed to upload image');
  }
}

export async function deleteFromCld(imageUrl: string, source: ImageSource) {
  try {
    await api.delete('/api/image/delete', {
      data: { imageUrl, source },
    });
  } catch (error) {
    console.error('Error deleting image:', error);
    logger.error('Error deleting image:', error);
  }
}

export async function uploadAndReplaceImage({
  newFile,
  folder,
  oldImageUrl,
  source = IMAGE_SOURCE.USER,
}: {
  newFile: File;
  folder: EARN_IMAGE_FOLDER;
  oldImageUrl?: string;
  source?: ImageSource;
}) {
  try {
    const newImageUrl = await uploadToCld(newFile, folder, source);

    if (oldImageUrl) {
      try {
        await deleteFromCld(oldImageUrl, source);
      } catch (error) {
        logger.error('Failed to delete old image during replacement:', {
          error,
          oldImageUrl,
          newImageUrl,
        });
      }
    }

    return newImageUrl;
  } catch (error) {
    logger.error('Error replacing image:', error);
    throw new Error('Failed to replace image');
  }
}
