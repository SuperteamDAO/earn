import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import logger from '@/lib/logger';
import { updateLike } from '@/services/likeService';
import { safeStringify } from '@/utils/safeStringify';

async function grantApplication(
  req: NextApiRequestWithUser,
  res: NextApiResponse,
) {
  try {
    const userId = req.userId;
    const { id }: { id: string } = req.body;
    logger.debug(`Request body: ${safeStringify(req.body)}`);

    if (!id) {
      return res.status(400).json({
        message: 'Grant ID is required.',
      });
    }

    const { updatedData: updatedGrant } = await updateLike(
      'grantApplication',
      id,
      userId!,
    );

    return res.status(200).json(updatedGrant);
  } catch (error: any) {
    logger.error(
      `Error updating submission like for user=${req.userId}: ${error.message}`,
    );
    return res.status(500).json({
      error: error.message,
      message: 'Error occurred while updating submission like.',
    });
  }
}

export default withAuth(grantApplication);
