import { type NextApiResponse } from 'next';
import sharp from 'sharp';

import logger from '@/lib/logger';
import { uploadImage } from '@/utils/cloudinary';
import { safeStringify } from '@/utils/safeStringify';

import { type NextApiRequestWithUser } from '@/features/auth/types';
import { withAuth } from '@/features/auth/utils/withAuth';

const ALLOWED_FORMATS = ['jpeg', 'png', 'webp'];

async function handler(req: NextApiRequestWithUser, res: NextApiResponse) {
  logger.debug(`Request body: ${safeStringify(req.body)}`);

  try {
    const { imageBase64, folder, type } = req.body;
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

    const url = await uploadImage(
      buffer,
      folderName,
      type === 'pfp' ? 200 : undefined,
    );
    return res.status(200).json({ message: 'Upload successful', url });
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
