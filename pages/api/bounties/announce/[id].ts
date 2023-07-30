import type { NextApiRequest, NextApiResponse } from 'next';

import { WinnersAnnouncedTemplate } from '@/components/emails/winnersAnnouncedTemplate';
import type { Rewards } from '@/interface/bounty';
import { prisma } from '@/prisma';
import { dayjs } from '@/utils/dayjs';
import { rateLimitedPromiseAll } from '@/utils/rateLimitedPromises';
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

    const subscribedUsers = await prisma.subscribeBounty.findMany({
      where: {
        bountyId: id,
      },
      include: {
        User: true,
      },
    });

    const allSubscribedUsers = subscribedUsers?.map((subscribedUser) => ({
      email: subscribedUser?.User?.email || '',
      name: subscribedUser?.User?.firstName || '',
    }));

    const allSubmissionUsersWithType: any[] = allSubmissionUsers.map(
      (submissionUser) => ({
        email: submissionUser?.email || '',
        name: submissionUser?.name || '',
        userType: 'submissionUser',
      })
    );

    const allSubscribedUsersWithType: any[] = allSubscribedUsers.map(
      (subscribedUser) => ({
        email: subscribedUser.email,
        name: subscribedUser.name,
        userType: 'subscribedUser',
      })
    );

    const allUsers = [
      ...allSubmissionUsersWithType,
      ...allSubscribedUsersWithType,
    ];

    await rateLimitedPromiseAll(allUsers, 9, async (user) => {
      const template = WinnersAnnouncedTemplate({
        name: user.name,
        bountyName: bounty?.title || '',
        link: `${getURL()}listings/bounties/${
          bounty?.slug || ''
        }/?utm_source=superteamearn&utm_medium=email&utm_campaign=winnerannouncement`,
      });

      const data = await resendMail.emails.send({
        from: `Kash from Superteam <${process.env.SENDGRID_EMAIL}>`,
        to: [user.email],
        subject: 'Bounty Winners Announced!',
        react: template,
      });

      return data;
    });

    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({
      error,
      message: `Error occurred while announcing bounty with id=${id}.`,
    });
  }
}
