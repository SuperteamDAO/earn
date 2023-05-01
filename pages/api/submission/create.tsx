import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function submission(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { userId, listingId, listingType, link, tweet, eligibilityAnswers } =
    req.body;
  try {
    const result = await prisma.submission.create({
      data: {
        userId,
        listingId,
        listingType,
        link: link || '',
        tweet: tweet || '',
        eligibilityAnswers: eligibilityAnswers || undefined,
      },
    });
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({
      error,
      message: 'Error occurred while adding a new submission.',
    });
  }
}
