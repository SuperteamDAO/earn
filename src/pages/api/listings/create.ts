import axios from 'axios';
import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import { sendEmailNotification } from '@/features/emails';
import { shouldSendEmailForListing } from '@/features/listing-builder';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { fetchTokenUSDValue } from '@/utils/fetchTokenUSDValue';

async function handler(req: NextApiRequestWithUser, res: NextApiResponse) {
  const userId = req.userId;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId as string },
    });

    if (!user || !user.currentSponsorId) {
      return res
        .status(403)
        .json({ error: 'User does not have a current sponsor.' });
    }

    const { title, ...data } = req.body;
    let usdValue = 0;

    let publishedAt;
    if (data.isPublished) {
      publishedAt = new Date();
    }

    if (data.isPublished && publishedAt) {
      try {
        let amount;
        if (data.compensationType === 'fixed') {
          amount = data.rewardAmount;
        } else if (data.compensationType === 'range') {
          amount = (data.minRewardAsk + data.maxRewardAsk) / 2;
        }

        if (amount && data.token) {
          const tokenUsdValue = await fetchTokenUSDValue(
            data.token,
            publishedAt,
          );
          usdValue = tokenUsdValue * amount;
        }
      } catch (error) {
        logger.error('Error calculating USD value:', error);
      }
    }

    const finalData = {
      sponsorId: user.currentSponsorId,
      title,
      usdValue,
      publishedAt,
      ...data,
    };

    const result = await prisma.bounties.create({
      data: finalData,
      include: { sponsor: true },
    });

    const shouldSendEmail = await shouldSendEmailForListing(result);
    if (shouldSendEmail) {
      await sendEmailNotification({
        type: 'createListing',
        id: result.id,
        triggeredBy: userId,
      });
    }

    if (process.env.NEXT_PUBLIC_VERCEL_ENV === 'production') {
      try {
        const zapierWebhookUrl = process.env.ZAPIER_BOUNTY_WEBHOOK!;
        await axios.post(zapierWebhookUrl, result);
      } catch (error) {
        logger.error('Error with Zapier Webhook:', error);
      }
    }

    return res.status(200).json(result);
  } catch (error: any) {
    logger.error(`User ${userId} unable to create a listing:`, error.message);
    return res.status(400).json({
      error,
      message: 'Error occurred while adding a new bounty.',
    });
  }
}

export default withAuth(handler);
