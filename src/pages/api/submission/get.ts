import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import { prisma } from '@/prisma';

async function submission(req: NextApiRequestWithUser, res: NextApiResponse) {
  const userId = req.userId;

  const id = req.query.id as string;

  try {
    const result = await prisma.submission.findFirst({
      where: {
        userId,
        listingId: id,
      },
    });

    return res.status(200).json(result);
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      error,
      message: 'Error occurred while getting the submission.',
    });
  }
}

export default withAuth(submission);
