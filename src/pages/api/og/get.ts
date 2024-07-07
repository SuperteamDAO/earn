import type { NextApiRequest, NextApiResponse } from 'next';
import { unfurl } from 'unfurl.js';

import logger from '@/lib/logger';
import { safeStringify } from '@/utils/safeStringify';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { url } = req.body;

  logger.debug(`Request body: ${safeStringify(req.body)}`);

  if (!url) {
    logger.warn('URL is required');
    return res.status(400).json({ error: 'URL is required.' });
  }

  try {
    logger.debug(`Unfurling URL: ${url}`);
    const result = await unfurl(url);
    logger.info(`Successfully unfurled URL: ${url}`);
    return res.status(200).json(result);
  } catch (error: any) {
    logger.error(`Error unfurling URL: ${url}`, safeStringify(error));
    return res
      .status(500)
      .json({ error: 'Error occurred while unfurling the URL.' });
  }
}
