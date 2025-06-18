import type { NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { updateLike } from '@/services/likeService';
import { safeStringify } from '@/utils/safeStringify';

import type { NextApiRequestWithUser } from '@/features/auth/types';
import { withAuth } from '@/features/auth/utils/withAuth';

async function comment(req: NextApiRequestWithUser, res: NextApiResponse) {
  try {
    const userId = req.userId;
    const { id }: { id: string } = req.body;
    logger.debug(`Request body: ${safeStringify(req.body)}`);

    if (!id) {
      return res.status(400).json({
        message: 'Comment ID is required.',
      });
    }

    if (!userId) {
      return res.status(400).json({
        message: 'User ID is required.',
      });
    }

    const { updatedData: updatedComment } = await updateLike(
      'comment',
      id,
      userId,
    );

    return res.status(200).json(updatedComment);
  } catch (error: any) {
    logger.error(
      `Error updating comment like for user=${req.userId}: ${error.message}`,
    );
    return res.status(500).json({
      error: error.message,
      message: 'Error occurred while updating comment like.',
    });
  }
}

export default withAuth(comment);
