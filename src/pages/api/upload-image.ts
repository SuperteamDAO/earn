import { v2 as cloudinary } from 'cloudinary';
import { type NextApiResponse } from 'next';
import sharp from 'sharp';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import logger from '@/lib/logger';
import { safeStringify } from '@/utils/safeStringify';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const ALLOWED_FORMATS = ['jpeg', 'png', 'webp'];

async function handler(req: NextApiRequestWithUser, res: NextApiResponse) {
  logger.debug(`Request body: ${safeStringify(req.body)}`);

  try {
    const { imageBase64, type, folder } = req.body;
    const buffer = Buffer.from(imageBase64, 'base64');

    const metadata = await sharp(buffer).metadata();
    if (!metadata.format || !ALLOWED_FORMATS.includes(metadata.format)) {
      logger.warn(`Invalid image format detected: ${metadata.format}`);
      return res.status(400).json({
        error: 'Invalid image format',
        message: `File type must be one of: ${ALLOWED_FORMATS.map((f) => `image/${f}`).join(', ')}`,
      });
    }

    const isDev = process.env.VERCEL_ENV !== 'production';
    const folderName = isDev ? `${folder}-dev` : folder;

    logger.debug('Processing image with Sharp');
    const processedImage = await sharp(buffer)
      .resize(type === 'pfp' ? 200 : undefined)
      .png({ quality: 80 })
      .toBuffer();

    logger.info('Uploading processed image to Cloudinary');
    cloudinary.uploader
      .upload_stream(
        { resource_type: 'image', folderName },
        (error, result) => {
          if (error) {
            logger.error(
              `Error uploading to Cloudinary: ${safeStringify(error)}`,
            );
            return res
              .status(500)
              .json({ error: 'Error uploading to Cloudinary', details: error });
          }
          if (result && result.secure_url) {
            logger.info('Upload to Cloudinary successful');
            return res
              .status(200)
              .json({ message: 'Upload successful', url: result.secure_url });
          } else {
            logger.error('Unexpected error with Cloudinary result');
            return res
              .status(500)
              .json({ error: 'Unexpected error with Cloudinary result' });
          }
        },
      )
      .end(processedImage);
  } catch (error: any) {
    logger.error(`Server error: ${safeStringify(error)}`);
    return res
      .status(500)
      .json({ error: 'Server error', details: error.message });
  }
}

export default withAuth(handler);

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '5mb',
    },
  },
};
