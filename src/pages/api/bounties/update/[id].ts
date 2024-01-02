import axios from 'axios';
import type { NextApiRequest, NextApiResponse } from 'next';

import { DeadlineExtendedTemplate } from '@/components/emails/deadlineExtendedTemplate';
import { prisma } from '@/prisma';
import resendMail from '@/utils/resend';

export default async function bounty(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const params = req.query;
  const id = params.id as string;
  const updatedData = req.body;

  try {
    const currentBounty = await prisma.bounties.findUnique({
      where: { id },
    });

    if (!currentBounty) {
      res.status(404).json({ message: `Bounty with id=${id} not found.` });
      return;
    }

    const newRewardsCount = Object.keys(updatedData.rewards || {}).length;
    const currentTotalWinners = currentBounty.totalWinnersSelected || 0;

    if (newRewardsCount < currentTotalWinners) {
      updatedData.totalWinnersSelected = newRewardsCount;

      const positions = ['first', 'second', 'third', 'fourth', 'fifth'];
      const positionsToReset = positions.slice(newRewardsCount);

      // eslint-disable-next-line no-restricted-syntax
      for (const position of positionsToReset) {
        // eslint-disable-next-line no-await-in-loop
        await prisma.submission.updateMany({
          where: {
            listingId: id,
            isWinner: true,
            winnerPosition: position,
          },
          data: {
            isWinner: false,
            winnerPosition: null,
          },
        });
      }
    }

    const result = await prisma.bounties.update({
      where: { id },
      data: updatedData,
    });

    const deadlineChanged = currentBounty.deadline !== updatedData.deadline;

    if (deadlineChanged) {
      const subscribers = await prisma.subscribeBounty.findMany({
        where: {
          bountyId: id,
        },
        include: {
          User: true,
        },
      });

      const emailPromises = subscribers.map((subscriber) =>
        resendMail.emails.send({
          from: `Kash from Superteam <${process.env.RESEND_EMAIL}>`,
          to: subscriber.User.email,
          subject: 'Listing Deadline Extended!',
          react: DeadlineExtendedTemplate({
            listingName: result.title,
            link: `https://earn.superteam.fun/listings/bounties/${result.slug}/`,
          }),
        })
      );

      await Promise.all(emailPromises);
    }

    const zapierWebhookUrl = process.env.ZAPIER_BOUNTY_WEBHOOK!;
    await axios.post(zapierWebhookUrl, result);

    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({
      error,
      message: `Error occurred while updating bounty with id=${id}.`,
    });
  }
}
