import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import { discordWinnersAnnouncement } from '@/features/discord';
import { sendEmailNotification } from '@/features/emails';
import { type Rewards } from '@/features/listings';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { dayjs } from '@/utils/dayjs';
import { safeStringify } from '@/utils/safeStringify';

async function announce(req: NextApiRequestWithUser, res: NextApiResponse) {
  const userId = req.userId;
  const params = req.query;
  const id = params.id as string;

  logger.debug(`Request query: ${safeStringify(req.query)}`);

  try {
    logger.debug(`Fetching user details for user ID: ${userId}`);
    const user = await prisma.user.findUnique({
      where: {
        id: userId as string,
      },
    });

    logger.debug(`Fetching bounty details for bounty ID: ${id}`);
    const bounty = await prisma.bounties.findUnique({
      where: { id },
      include: {
        sponsor: true,
      },
    });

    if (
      !user ||
      !user.currentSponsorId ||
      bounty?.sponsorId !== user.currentSponsorId
    ) {
      logger.warn(
        `User ID: ${userId} does not have a current sponsor or is unauthorized to announce winners for bounty ID: ${id}`,
      );
      return res
        .status(403)
        .json({ error: 'User does not have a current sponsor.' });
    }

    if (!bounty) {
      logger.warn(`Bounty with ID: ${id} not found`);
      return res
        .status(404)
        .json({ message: `Bounty with id=${id} not found.` });
    }

    if (bounty?.isWinnersAnnounced) {
      logger.warn(`Winners already announced for bounty with ID: ${id}`);
      return res.status(400).json({
        message: `Winners already announced for bounty with id=${id}.`,
      });
    }

    if (!bounty?.isActive) {
      logger.warn(`Bounty with ID: ${id} is not active`);
      return res
        .status(400)
        .json({ message: `Bounty with id=${id} is not active.` });
    }

    const totalRewards = Object.keys(bounty?.rewards || {})?.length || 0;
    if (!!totalRewards && bounty?.totalWinnersSelected !== totalRewards) {
      logger.warn(
        'All winners have not been selected before publishing the results',
      );
      return res.status(400).json({
        message: 'Please select all winners before publishing the results.',
      });
    }

    const deadline = dayjs().isAfter(bounty?.deadline)
      ? bounty?.deadline
      : dayjs().subtract(2, 'minute').toISOString();

    logger.debug('Updating bounty details with winner announcement');
    const result = await prisma.bounties.update({
      where: { id },
      data: {
        isWinnersAnnounced: true,
        deadline,
        winnersAnnouncedAt: new Date().toISOString(),
      },
      include: {
        sponsor: true,
      },
    });
    try {
      await discordWinnersAnnouncement(result);
    } catch (err) {
      console.log('Discord Listing Update Message Error', err);
    }
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

    logger.info(`Fetched ${winners.length} winners for bounty ID: ${id}`);

    const sortSubmissions = (
      a: (typeof winners)[0],
      b: (typeof winners)[0],
    ) => {
      const order = { first: 1, second: 2, third: 3, fourth: 4, fifth: 5 };
      const aPosition = a.winnerPosition as keyof typeof order;
      const bPosition = b.winnerPosition as keyof typeof order;

      if (a.winnerPosition && b.winnerPosition) {
        return (
          (order[aPosition] || Number.MAX_VALUE) -
          (order[bPosition] || Number.MAX_VALUE)
        );
      }

      if (a.winnerPosition && !b.winnerPosition) {
        return -1;
      }

      if (!a.winnerPosition && b.winnerPosition) {
        return 1;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    };

    const sortedWinners = winners.sort(sortSubmissions);

    const extractedTags = sortedWinners
      .map((c, i) => {
        if (i > 0 && i === sortedWinners.length - 1)
          return `and @${c.user.username}`;
        else return `@${c.user.username}`;
      })
      .join(sortedWinners.length > 2 ? ', ' : ' ');

    let comment: string = 'Winners have been announced. ';
    const random = Math.floor(Math.random() * (2 - 1 + 1)) + 1;
    switch (random) {
      case 1:
        comment =
          sortedWinners.length === 1
            ? `Congratulations! ${extractedTags} has been announced as the winner!`
            : `Congratulations! ${extractedTags} have been announced as the winners!`;
        break;
      case 2:
        if (bounty.type === 'bounty')
          comment = `Applaud ${extractedTags} for winning this Bounty`;
        if (bounty.type === 'project')
          comment = `Applaud ${extractedTags} for winning this Project`;
        break;
    }

    logger.debug('Creating winner announcement comment');
    await prisma.comment.create({
      data: {
        authorId: user.id,
        listingId: id,
        message: comment,
        type: 'WINNER_ANNOUNCEMENT',
      },
    });

    const promises = [];
    let currentIndex = 0;

    while (currentIndex < winners?.length) {
      const amount: number = winners[currentIndex]?.winnerPosition
        ? Math.ceil(
            rewards[winners[currentIndex]?.winnerPosition as keyof Rewards] ||
              0,
          )
        : 0;

      const rewardInUSD = (bounty.usdValue! / bounty.rewardAmount!) * amount;

      const amountWhere = {
        where: {
          id: winners[currentIndex]?.userId,
        },
        data: {
          totalEarnedInUSD: {
            increment: rewardInUSD,
          },
        },
      };

      promises.push(
        prisma.submission.update({
          where: {
            id: winners[currentIndex]?.id,
          },
          data: {
            rewardInUSD,
          },
        }),
      );
      promises.push(prisma.user.update(amountWhere));
      currentIndex += 1;
    }

    await Promise.all(promises);

    logger.debug('Sending winner announcement email notifications');
    await sendEmailNotification({
      type: 'announceWinners',
      id,
      triggeredBy: userId,
    });

    if (bounty?.sponsor?.name.includes('Superteam')) {
      await sendEmailNotification({
        type: 'superteamWinners',
        id,
        triggeredBy: userId,
      });
    } else {
      logger.info('Sponsor is not Superteam. Skipping sending winner emails.');
    }

    logger.info(`Winners announced successfully for bounty ID: ${id}`);
    return res.status(200).json(result);
  } catch (error: any) {
    logger.error(
      `User ${userId} unable to announce winners for bounty ID: ${id}: ${safeStringify(error)}`,
    );
    return res.status(400).json({
      error: error.message,
      message: `Error occurred while announcing bounty with id=${id}.`,
    });
  }
}

export default withAuth(announce);
