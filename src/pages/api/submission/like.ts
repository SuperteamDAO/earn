import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import { sendEmailNotification } from '@/features/emails';
import { updateLike } from '@/services/likeService';

async function submission(req: NextApiRequestWithUser, res: NextApiResponse) {
  try {
    const userId = req.userId;
    const { id } = req.body;

    const updatedSubmission = await updateLike('submission', id, userId!);

    if (
      Array.isArray(updatedSubmission?.like) &&
      updatedSubmission.like.length > 0
    ) {
      await sendEmailNotification({
        type: 'submissionLike',
        id,
        userId: updatedSubmission?.userId,
      });
    }

    return res.status(200).json(updatedSubmission);
  } catch (error) {
    return res.status(400).json({
      error,
      message: `Error occurred while updating submission like.`,
    });
  }
}

export default withAuth(submission);
