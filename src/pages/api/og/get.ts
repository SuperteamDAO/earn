import type { NextApiRequest, NextApiResponse } from 'next';
import { unfurl } from 'unfurl.js';

import logger from '@/lib/logger';
import { safeStringify } from '@/utils/safeStringify';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.query;

  logger.debug(`Request query: ${safeStringify(req.query)}`);

  if (!url || typeof url !== 'string') {
    logger.warn('URL is required and must be a string');
    return res
      .status(400)
      .json({ error: 'URL is required and must be a string.' });
  }

  try {
    logger.debug(`Unfurling URL: ${url}`);
    const metadata = await unfurl(url);

    // const result = metadata.open_graph.images?.[0]?.url;

    logger.info(`Successfully unfurled URL: ${url}`);
    return res.status(200).json({ result: metadata.open_graph });
  } catch (error: any) {
    logger.warn(`Error unfurling URL: ${url}`, safeStringify(error));
    return res
      .status(500)
      .json({ error: 'Error occurred while unfurling the URL.' });
  }
}
