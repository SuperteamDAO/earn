import axios from 'axios';
import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import { discordListingUpdate } from '@/features/discord';
import { sendEmailNotification } from '@/features/emails';
import { hasRewardConditionsForEmail } from '@/features/listing-builder';
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

    try {
      await discordListingUpdate(
        result,
        result.isPublished ? 'Published' : 'Draft Added',
      );
    } catch (err) {
      console.log('Discord Listing Update Message Error', err);
    }

    if (
      result.isPublished &&
      !result.isPrivate &&
      result.type !== 'hackathon' &&
      hasRewardConditionsForEmail(result)
    ) {
      await sendEmailNotification({
        type: 'createListing',
        id: result.id,
      });
    }
    try {
      if (process.env.NEXT_PUBLIC_VERCEL_ENV === 'production') {
        const zapierWebhookUrl = process.env.ZAPIER_BOUNTY_WEBHOOK!;
        await axios.post(zapierWebhookUrl, result);
      }
    } catch (err) {
      console.log('Error with Zapier Webhook -', err);
    }
    return res.status(200).json(result);
  } catch (error: any) {
    console.error(`User ${userId} unable to create a listing`, error.message);
    return res.status(400).json({
      error,
      message: 'Error occurred while adding a new bounty.',
    });
  }
}

export default withAuth(handler);
