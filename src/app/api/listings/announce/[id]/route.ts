import { waitUntil } from '@vercel/functions';
import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

import earncognitoClient from '@/lib/earncognitoClient';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { dayjs } from '@/utils/dayjs';
import { cleanRewards } from '@/utils/rank';
import { safeStringify } from '@/utils/safeStringify';

import { checkListingSponsorAuth } from '@/features/auth/utils/checkListingSponsorAuth';
import { getSponsorSession } from '@/features/auth/utils/getSponsorSession';
import { sendEmailNotification } from '@/features/emails/utils/sendEmailNotification';
import { BONUS_REWARD_POSITION } from '@/features/listing-builder/constants';
import { type Rewards } from '@/features/listings/types';

export const maxDuration = 300;

export async function POST(
  _request: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;
  try {
    const session = await getSponsorSession(await headers());

    logger.debug(`Request params: ${safeStringify(params)}`);

    if (session.error || !session.data) {
      return NextResponse.json(
        { error: session.error },
        { status: session.status },
      );
    }

    const { userId, userSponsorId } = session.data;
    const id = params.id;

    const { error, listing } = await checkListingSponsorAuth(userSponsorId, id);
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    if (listing?.isWinnersAnnounced) {
      logger.warn(`Winners already announced for bounty with ID: ${id}`);

      return NextResponse.json(
        { error: `Winners already announced for bounty with id=${id}.` },
        { status: 400 },
      );
    }

    if (!listing?.isActive) {
      logger.warn(`Bounty with ID: ${id} is not active`);
      return NextResponse.json(
        { error: `Bounty with id=${id} is not active.` },
        { status: 400 },
      );
    }
    if (!listing?.isPublished) {
      logger.warn(`Bounty with ID: ${id} is not published`);
      return NextResponse.json(
        { error: `Bounty with id=${id} is not published.` },
        { status: 400 },
      );
    }

    const totalRewards = [
      ...cleanRewards(listing?.rewards as Rewards, true),
      ...Array(listing?.maxBonusSpots ?? 0).map(() => BONUS_REWARD_POSITION),
    ].length;

    if (!!totalRewards && listing?.totalWinnersSelected !== totalRewards) {
      logger.warn(
        'All winners have not been selected before publishing the results',
      );
      return NextResponse.json(
        { error: 'Please select all winners before publishing the results.' },
        { status: 400 },
      );
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

    const rewards: Rewards = (listing?.rewards || {}) as Rewards;
    const winners = await prisma.submission.findMany({
      where: {
        listingId: id,
        isWinner: true,
        isActive: true,
        isArchived: false,
      },
      include: {
        user: true,
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

    waitUntil(
      (async () => {
        try {
          await earncognitoClient.post(`/discord/winners-announced`, {
            listingId: result.id,
          });
        } catch (err) {
          logger.error('Discord Listing Update Message Error', err);
        }

        try {
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
            return (
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
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
        } catch (err) {
          logger.error('Failed to create winner announcement comment', err);
        }

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

        logger.info(`ALl Non Blocking Tasks Triggered`);
      })(),
    );

    logger.info(`Winners announced successfully for bounty ID: ${id}`);
    return NextResponse.json({ message: 'Success' }, { status: 200 });
  } catch (error: any) {
    console.log(
      `Error announcing winners for bounty ID: ${params.id}: ${safeStringify(error)}`,
    );
    logger.error(
      `Error announcing winners for bounty ID: ${params.id}: ${safeStringify(error)}`,
    );
    return NextResponse.json(
      {
        error: error.message,
        message: `Error occurred while announcing bounty with id=${params.id}.`,
      },
      { status: 400 },
    );
  }
}
