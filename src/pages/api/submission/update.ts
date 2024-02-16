import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';

import { prisma } from '@/prisma';

export default async function updateSubmission(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const token = await getToken({ req });

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = token.id;

  if (!userId) {
    return res.status(400).json({ error: 'Invalid token' });
  }

  const { listingId, listingType, link, tweet, otherInfo, eligibilityAnswers } =
    req.body;

  try {
    const submission = await prisma.submission.findFirst({
      where: {
        userId,
        listingId,
      },
    });

    const result = await prisma.submission.update({
      where: {
        id: submission?.id,
      },
      data: {
        listingId,
        listingType,
        link: link || '',
        tweet: tweet || '',
        otherInfo: otherInfo || '',
        eligibilityAnswers: eligibilityAnswers || undefined,
      },
      include: {
        user: true,
        listing: true,
      },
    });

    return res.status(200).json(result);
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      error,
      message: 'Error occurred while updating the submission.',
    });
  }
}
