import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import logger from '@/lib/logger';
import { updateLike } from '@/services/likeService';
import { safeStringify } from '@/utils/safeStringify';

async function poWLike(req: NextApiRequestWithUser, res: NextApiResponse) {
  const userId = req.userId;
  const { id } = req.body;
  logger.debug(`Request body: ${safeStringify(req.body)}`);

  try {
    if (!id) {
      logger.warn('PoW ID is missing in the request body');
      return res.status(400).json({
        error: 'PoW ID is required in the request body',
      });
    }

    const { updatedData: updatedPoW } = await updateLike('poW', id, userId!);

    logger.info(`Successfully updated PoW like for id ${id}`);
    return res.status(200).json(updatedPoW);
  } catch (error: any) {
    logger.error(
      `Error updating PoW like for id ${req.body?.id}:`,
      safeStringify(error),
    );
    return res.status(500).json({
      error: error.message,
      message: 'Error occurred while updating PoW like',
    });
  }
}

export default withAuth(poWLike);
