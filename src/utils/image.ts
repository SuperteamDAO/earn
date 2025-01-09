import axios from 'axios';

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

export type EARN_IMAGE_FOLDER =
  | 'earn-pfp'
  | 'earn-sponsor'
  | 'listing-description';

export async function uploadToCld(
  file: File,
  folder: EARN_IMAGE_FOLDER,
  type = 'pfp',
) {
  try {
    const base64Image = await fileToBase64(file);
    const base64Content = base64Image.split(',')[1];

    const response = await axios.post('/api/image/upload', {
      imageBase64: base64Content,
      type,
      folder,
    });

    return response.data.url;
  } catch (error) {
    logger.error('Error uploading image to Cloudinary:', error);
    throw new Error('Failed to upload image');
  }
}

export async function deleteFromCld(imageUrl: string) {
  try {
    await axios.delete('/api/image/delete', { data: { imageUrl } });
  } catch (error) {
    console.error('Error deleting image:', error);
    logger.error('Error deleting image:', error);
  }
}

export async function uploadAndReplaceImage({
  newFile,
  folder,
  oldImageUrl,
  type = 'pfp',
}: {
  newFile: File;
  folder: EARN_IMAGE_FOLDER;
  oldImageUrl?: string;
  type?: 'pfp' | 'sponsor';
}) {
  try {
    const newImageUrl = await uploadToCld(newFile, folder, type);

    if (oldImageUrl) {
      try {
        await deleteFromCld(oldImageUrl);
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
