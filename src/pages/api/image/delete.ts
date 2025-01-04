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

function extractPublicIdFromUrl(url: string): string {
  try {
    const urlParts = url.split('/');
    const filenameWithExtension = urlParts[urlParts.length - 1];
    const filename = filenameWithExtension?.split('.')[0];
    const folderPath = urlParts[urlParts.length - 2];
    return `${folderPath}/${filename}`;
  } catch (error) {
    logger.error(
      `Error extracting public_id from URL: ${safeStringify(error)}`,
    );
    throw new Error('Invalid Cloudinary URL format');
  }
}

async function handler(req: NextApiRequestWithUser, res: NextApiResponse) {
  logger.debug(`Request body: ${safeStringify(req.body)}`);

  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      logger.warn('No image URL provided');
      return res.status(400).json({ error: 'Image URL is required' });
    }

    if (!imageUrl.includes('cloudinary')) {
      logger.warn('Invalid Cloudinary URL');
      return res.status(400).json({ error: 'Invalid Cloudinary URL' });
    }

    const publicId = extractPublicIdFromUrl(imageUrl);

    logger.info(`Attempting to delete image with public_id: ${publicId}`);

    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result === 'ok') {
      logger.info('Image successfully deleted from Cloudinary');
      return res.status(200).json({ message: 'Image deleted successfully' });
    } else {
      logger.error(`Failed to delete image: ${safeStringify(result)}`);
      return res.status(500).json({
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

export const config = {
  api: {
    bodyParser: true,
  },
};
