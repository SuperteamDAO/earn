import axios from 'axios';
import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import { sendEmailNotification } from '@/features/emails';
import { prisma } from '@/prisma';

async function submission(req: NextApiRequestWithUser, res: NextApiResponse) {
  const userId = req.userId;

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

    try {
      await sendEmailNotification({
        type: 'submissionTalent',
        id: listingId,
        userId: userId as string,
      });

      await sendEmailNotification({
        type: 'submissionSponsor',
        id: listingId,
        userId: result?.listing?.pocId,
      });

      if (process.env.NEXT_PUBLIC_VERCEL_ENV === 'production') {
        const zapierWebhookUrl = process.env.ZAPIER_SUBMISSION_WEBHOOK!;
        await axios.post(zapierWebhookUrl, result);
      }
    } catch (err) {
      console.log(err);
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

export default withAuth(submission);
