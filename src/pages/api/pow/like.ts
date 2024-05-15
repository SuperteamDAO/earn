import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import { updateLike } from '@/services/likeService';

async function poWLike(req: NextApiRequestWithUser, res: NextApiResponse) {
  try {
    const userId = req.userId;
    const { id } = req.body;

    const updatedPoW = await updateLike('poW', id, userId!);

    return res.status(200).json(updatedPoW);
  } catch (error) {
    return res.status(400).json({
      error,
      message: `Error occurred while updating PoW like.`,
    });
  }
}

export default withAuth(poWLike);
