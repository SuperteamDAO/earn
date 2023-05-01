import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function submission(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { userId, listingId, listingType, link, tweet, eligibilityAnswers } =
    req.body;
  console.log(
    'file: create.tsx:10 ~ userId, listingId, listingType, link, tweet, eligibilityAnswers:',
    userId,
    listingId,
    listingType,
    link,
    tweet,
    eligibilityAnswers
  );
  try {
    const result = await prisma.submission.create({
      data: {
        userId,
        listingId,
        listingType,
        link: link || '',
        tweet: tweet || '',
        eligibilityAnswers: eligibilityAnswers || null,
      },
    });
    res.status(200).json(result);
  } catch (error) {
    console.log('file: create.tsx:24 ~ error:', error);
    res.status(400).json({
      error,
      message: 'Error occurred while adding a new submission.',
    });
  }
}
