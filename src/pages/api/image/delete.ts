import { v2 as cloudinary } from 'cloudinary';
import { type NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { safeStringify } from '@/utils/safeStringify';

import { type NextApiRequestWithUser } from '@/features/auth/types';
import { withAuth } from '@/features/auth/utils/withAuth';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function handler(req: NextApiRequestWithUser, res: NextApiResponse) {
  logger.debug(`Request body: ${safeStringify(req.body)}`);

  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL is required' });
    }

    const urlParts = imageUrl.split('/');
    const publicIdWithExtension = urlParts[urlParts.length - 1];
    const publicId = publicIdWithExtension.split('.')[0];

    logger.info(`Attempting to delete image with public ID: ${publicId}`);

    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result === 'ok') {
      logger.info('Image deleted successfully');
      return res.status(200).json({ message: 'Image deleted successfully' });
    } else {
      logger.error(`Failed to delete image: ${safeStringify(result)}`);
      return res.status(404).json({
        error: 'Failed to delete image',
        details: result,
      });
    }
  } catch (error: any) {
    logger.error(`Server error: ${safeStringify(error)}`);
    return res.status(500).json({
      error: 'Server error',
      details: error.message,
    });
  }
}

export default withAuth(handler);
