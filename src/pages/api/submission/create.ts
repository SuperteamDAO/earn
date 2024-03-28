import axios from 'axios';
import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';

import { sendEmailNotification } from '@/features/emails';
import { prisma } from '@/prisma';

export default async function submission(
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

  const { listingId, link, tweet, otherInfo, eligibilityAnswers, ask } =
    req.body;
  try {
    const result = await prisma.submission.create({
      data: {
        userId: userId as string,
        listingId,
        link: link || '',
        tweet: tweet || '',
        otherInfo: otherInfo || '',
        eligibilityAnswers: eligibilityAnswers || undefined,
        ask: ask || null,
      },
      include: {
        user: true,
        listing: true,
      },
    });

    await sendEmailNotification({
      type: 'submissionTalent',
      id: listingId,
      userId: userId as string,
    });

    await sendEmailNotification({
      type: 'submissionSponsor',
      id: listingId,
      userId: userId as string,
    });

    if (process.env.NEXT_PUBLIC_VERCEL_ENV === 'production') {
      const zapierWebhookUrl = process.env.ZAPIER_SUBMISSION_WEBHOOK!;
      await axios.post(zapierWebhookUrl, result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      error,
      message: 'Error occurred while adding a new submission.',
    });
  }
}
