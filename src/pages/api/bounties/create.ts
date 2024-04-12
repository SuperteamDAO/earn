import axios from 'axios';
import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import { sendEmailNotification } from '@/features/emails';
import { prisma } from '@/prisma';

async function handler(req: NextApiRequestWithUser, res: NextApiResponse) {
  const userId = req.userId;

  const user = await prisma.user.findUnique({
    where: {
      id: userId as string,
    },
  });

  if (!user || !user.currentSponsorId) {
    return res
      .status(403)
      .json({ error: 'User does not have a current sponsor.' });
  }

  const { title, ...data } = req.body;
  try {
    const finalData = {
      sponsorId: user.currentSponsorId,
      title,
      ...data,
    };
    const result = await prisma.bounties.create({
      data: finalData,
      include: {
        sponsor: true,
      },
    });

    if (
      result.isPublished &&
      !result.isPrivate &&
      result.type !== 'hackathon'
    ) {
      await sendEmailNotification({
        type: 'createListing',
        id: result.id,
      });
    }
    if (process.env.NEXT_PUBLIC_VERCEL_ENV === 'production') {
      const zapierWebhookUrl = process.env.ZAPIER_BOUNTY_WEBHOOK!;
      await axios.post(zapierWebhookUrl, result);
    }
    return res.status(200).json(result);
  } catch (error) {
    console.log('file: create.ts:31 ~ user ~ error:', error);
    return res.status(400).json({
      error,
      message: 'Error occurred while adding a new bounty.',
    });
  }
}

export default withAuth(handler);
