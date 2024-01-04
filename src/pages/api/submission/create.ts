import axios from 'axios';
import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function submission(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const {
    userId,
    listingId,
    listingType,
    link,
    tweet,
    otherInfo,
    eligibilityAnswers,
  } = req.body;
  try {
    const result = await prisma.submission.create({
      data: {
        userId,
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

    const zapierWebhookUrl = process.env.ZAPIER_SUBMISSION_WEBHOOK!;
    await axios.post(zapierWebhookUrl, result);

    res.status(200).json(result);
  } catch (error) {
    console.log(error);
    res.status(400).json({
      error,
      message: 'Error occurred while adding a new submission.',
    });
  }
}
