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

export type EARN_IMAGE_FOLDER =
  | 'earn-pfp'
  | 'earn-sponsor'
  | 'listing-description';

export async function uploadToCloudinary(
  file: any,
  folder: EARN_IMAGE_FOLDER,
  type = 'pfp',
) {
  try {
    const base64Image = await fileToBase64(file);
    const base64Content = base64Image.split(',')[1];

    const response = await api.post('/api/upload-image', {
      imageBase64: base64Content,
      type,
      folder,
    });

    return response.data.url;
  } catch (error) {
    console.log('Error uploading the image:', error);
    logger.error('Error uploading the image:', error);
  }
}
