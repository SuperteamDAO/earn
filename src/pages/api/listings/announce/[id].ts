import type { NextApiResponse } from 'next';

import { BONUS_REWARD_POSITION } from '@/constants';
import {
  checkListingSponsorAuth,
  type NextApiRequestWithSponsor,
  withSponsorAuth,
} from '@/features/auth';
import { sendEmailNotification } from '@/features/emails';
import { type Rewards } from '@/features/listings';
import earncognitoClient from '@/lib/earncognitoClient';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { dayjs } from '@/utils/dayjs';
import { cleanRewards } from '@/utils/rank';
import { safeStringify } from '@/utils/safeStringify';

async function announce(req: NextApiRequestWithSponsor, res: NextApiResponse) {
  const userId = req.userId;
  const userSponsorId = req.userSponsorId;
  const params = req.query;
  const id = params.id as string;

  logger.debug(`Request query: ${safeStringify(req.query)}`);

  const { error, listing } = await checkListingSponsorAuth(userSponsorId, id);
  if (error) {
    return res.status(error.status).json({ error: error.message });
  }

  try {
    if (listing?.isWinnersAnnounced) {
      logger.warn(`Winners already announced for bounty with ID: ${id}`);
      return res.status(400).json({
        message: `Winners already announced for bounty with id=${id}.`,
      });
    }

    if (!listing?.isActive) {
      logger.warn(`Bounty with ID: ${id} is not active`);
      return res
        .status(400)
        .json({ message: `Bounty with id=${id} is not active.` });
    }

    if (!listing?.isPublished) {
      logger.warn(`Bounty with ID: ${id} is not published`);
      return res
        .status(400)
        .json({ message: `Bounty with id=${id} is not published.` });
    }

    const totalRewards = [
      ...cleanRewards(listing?.rewards as Rewards, true),
      ...Array(listing?.maxBonusSpots ?? 0).map(() => BONUS_REWARD_POSITION),
    ].length;

    if (!!totalRewards && listing?.totalWinnersSelected !== totalRewards) {
      logger.warn(
        'All winners have not been selected before publishing the results',
      );
      return res.status(400).json({
        message: 'Please select all winners before publishing the results.',
      });
    }

    const deadline = dayjs().isAfter(listing?.deadline)
      ? listing?.deadline
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
      await earncognitoClient.post(`/discord/winners-announced`, {
        listingId: result.id,
      });
    } catch (err) {
      logger.error('Discord Listing Update Message Error', err);
    }
    const rewards: Rewards = (listing?.rewards || {}) as Rewards;
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
      if (a.winnerPosition && b.winnerPosition) {
        return (
          (Number(a.winnerPosition) || Number.MAX_VALUE) -
          (Number(b.winnerPosition) || Number.MAX_VALUE)
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
        if (listing.type === 'bounty')
          comment = `Applaud ${extractedTags} for winning this Bounty`;
        if (listing.type === 'project')
          comment = `Applaud ${extractedTags} for winning this Project`;
        break;
    }

    logger.debug('Creating winner announcement comment');
    await prisma.comment.create({
      data: {
        authorId: userId!,
        refId: id,
        refType: 'BOUNTY',
        message: comment,
        type: 'WINNER_ANNOUNCEMENT',
      },
    });

    const promises = [];
    let currentIndex = 0;

    while (currentIndex < winners?.length) {
      const winnerPosition = Number(winners[currentIndex]?.winnerPosition);
      let amount: number = 0;
      if (winnerPosition && !isNaN(winnerPosition)) {
        amount = Math.ceil(rewards[winnerPosition as keyof Rewards] ?? 0);
      }

      const rewardInUSD = (listing.usdValue! / listing.rewardAmount!) * amount;

      promises.push(
        prisma.submission.update({
          where: {
            id: winners[currentIndex]?.id,
          },
          data: {
            rewardInUSD,
            status: 'Approved',
            label:
              winners[currentIndex]?.label === 'Unreviewed'
                ? 'Reviewed'
                : winners[currentIndex]?.label,
          },
        }),
      );

      currentIndex += 1;
    }

    await Promise.all(promises);

    logger.debug('Sending winner announcement email notifications');
    sendEmailNotification({
      type: 'announceWinners',
      id,
      triggeredBy: userId,
    });

    if (
      listing?.sponsor?.st &&
      listing.type !== 'project' &&
      listing.isFndnPaying
    ) {
      sendEmailNotification({
        type: 'STWinners',
        id,
        triggeredBy: userId,
      });
    } else {
      sendEmailNotification({
        type: 'nonSTWinners',
        id,
        triggeredBy: userId,
      });
    }

    try {
      await earncognitoClient.post(`/airtable/sync-announced-listings`, {
        listingId: result.id,
      });
    } catch (err) {
      logger.error('Airatable Listing Sync Message Error', err);
    }

    logger.info(`Winners announced successfully for bounty ID: ${id}`);
    return res.status(200).json({ message: 'Success' });
  } catch (error: any) {
    console.log(
      `User ${userId} unable to announce winners for bounty ID: ${id}: ${safeStringify(error)}`,
    );
    logger.error(
      `User ${userId} unable to announce winners for bounty ID: ${id}: ${safeStringify(error)}`,
    );
    return res.status(400).json({
      error: error.message,
      message: `Error occurred while announcing bounty with id=${id}.`,
    });
  }
}

export default withSponsorAuth(announce);
