import type { NextApiRequest, NextApiResponse } from 'next';

import { winnersAnnouncedEmailTemplate } from '@/components/emails/winnersAnnouncedTemplate';
import type { Rewards } from '@/interface/bounty';
import { prisma } from '@/prisma';
import { dayjs } from '@/utils/dayjs';
import resendMail from '@/utils/resend';
import { getURL } from '@/utils/validUrl';

export default async function announce(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const params = req.query;
  const id = params.id as string;
  try {
    const bounty = await prisma.bounties.findFirst({
      where: {
        id,
      },
    });
    if (bounty?.isWinnersAnnounced) {
      res.status(400).json({
        message: `Winners already announced for bounty with id=${id}.`,
      });
      return;
    }
    if (!bounty?.isActive) {
      res.status(400).json({
        message: `Bounty with id=${id} is not active.`,
      });
      return;
    }
    const totalRewards = Object.keys(bounty?.rewards || {})?.length || 0;
    if (!!totalRewards && bounty?.totalWinnersSelected !== totalRewards) {
      res.status(400).json({
        message: 'Please select all winners before publishing the results.',
      });
      return;
    }
    const deadline = dayjs().isAfter(bounty?.deadline)
      ? bounty?.deadline
      : dayjs().subtract(2, 'minute').toISOString();
    const result = await prisma.bounties.update({
      where: {
        id,
      },
      data: {
        isWinnersAnnounced: true,
        deadline,
      },
    });
    const rewards: Rewards = (bounty?.rewards || {}) as Rewards;
    const winners = await prisma.submission.findMany({
      where: {
        listingId: id,
        isWinner: true,
        isActive: true,
        isArchived: false,
      },
      take: 100,
      include: {
        user: true,
      },
    });

    const promises = [];
    let currentIndex = 0;

    while (currentIndex < winners?.length) {
      const amount: number = winners[currentIndex]?.winnerPosition
        ? Math.ceil(
            rewards[winners[currentIndex]?.winnerPosition as keyof Rewards] || 0
          )
        : 0;
      // TODO: convert amount to USD if token is not USDC, USDT, USD, DAI, or UST
      const amountWhere = {
        where: {
          id: winners[currentIndex]?.userId,
        },
        data: {
          totalEarnedInUSD: {
            increment: amount,
          },
        },
      };
      promises.push(prisma.user.update(amountWhere));
      currentIndex += 1;
    }
    await Promise.all(promises);

    const submissions = await prisma.submission.findMany({
      where: {
        listingId: id,
        isActive: true,
        isArchived: false,
      },
      take: 500,
      include: {
        user: true,
      },
    });
    const allSubmissionUsers = submissions?.map((submission) => ({
      email: submission?.user?.email || '',
      name: submission?.user?.firstName || '',
    }));

    const promises2 = allSubmissionUsers.map(async (submissionUser) => {
      const data = await resendMail.emails.send({
        from: `Kash from Superteam <${process.env.SENDGRID_EMAIL}>`,
        to: [submissionUser?.email],
        subject: 'Congratulations on Winning!',
        react: winnersAnnouncedEmailTemplate({
          name: submissionUser?.name,
          bountyName: bounty?.title || '',
          link: `${getURL()}listings/bounties/${
            bounty?.slug || ''
          }/?utm_source=superteamearn&utm_medium=email&utm_campaign=winnerannouncement`,
        }),
      });
      return data;
    });

    await Promise.all(promises2);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({
      error,
      message: `Error occurred while announcing bounty with id=${id}.`,
    });
  }
}
