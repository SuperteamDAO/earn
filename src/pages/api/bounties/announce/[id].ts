import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';

import { WinnersAnnouncedTemplate } from '@/components/emails/winnersAnnouncedTemplate';
import type { Rewards } from '@/interface/bounty';
import { prisma } from '@/prisma';
import { getUnsubEmails } from '@/utils/airtable';
import { getBountyTypeLabel } from '@/utils/bounty';
import { dayjs } from '@/utils/dayjs';
import { rateLimitedPromiseAll } from '@/utils/rateLimitedPromises';
import resendMail from '@/utils/resend';

export default async function announce(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const params = req.query;
  const id = params.id as string;
  try {
    const token = await getToken({ req });

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = token.id;

    if (!userId) {
      return res.status(400).json({ error: 'Invalid token' });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId as string,
      },
    });

    const bounty = await prisma.bounties.findUnique({
      where: { id },
    });

    if (
      !user ||
      !user.currentSponsorId ||
      bounty?.sponsorId !== user.currentSponsorId
    ) {
      return res
        .status(403)
        .json({ error: 'User does not have a current sponsor.' });
    }

    if (!bounty) {
      return res
        .status(404)
        .json({ message: `Bounty with id=${id} not found.` });
    }

    const unsubscribedEmails = await getUnsubEmails();

    if (bounty?.isWinnersAnnounced) {
      return res.status(400).json({
        message: `Winners already announced for bounty with id=${id}.`,
      });
    }
    if (!bounty?.isActive) {
      return res.status(400).json({
        message: `Bounty with id=${id} is not active.`,
      });
    }
    const totalRewards = Object.keys(bounty?.rewards || {})?.length || 0;
    if (!!totalRewards && bounty?.totalWinnersSelected !== totalRewards) {
      return res.status(400).json({
        message: 'Please select all winners before publishing the results.',
      });
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

    const listingType = getBountyTypeLabel(bounty?.type);

    await rateLimitedPromiseAll(allUsers, 9, async (e) => {
      if (unsubscribedEmails.includes(e.email)) return;

      const template = WinnersAnnouncedTemplate({
        name: e.name,
        bountyName: bounty?.title || '',
        link: `https://earn.superteam.fun/listings/bounties/${
          bounty?.slug || ''
        }/?utm_source=superteamearn&utm_medium=email&utm_campaign=winnerannouncement`,
      });

      await resendMail.emails.send({
        from: `Kash from Superteam <${process.env.RESEND_EMAIL}>`,
        to: [user.email],
        subject: `${listingType} Winners Announced!`,
        react: template,
      });
    });

    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      error,
      message: `Error occurred while announcing bounty with id=${id}.`,
    });
  }
}
