import { waitUntil } from '@vercel/functions';
import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

import { SIX_MONTHS } from '@/constants/SIX_MONTHS';
import earncognitoClient from '@/lib/earncognitoClient';
import logger from '@/lib/logger';
import { LockNotAcquiredError, withRedisLock } from '@/lib/with-redis-lock';
import { prisma } from '@/prisma';
import { dayjs } from '@/utils/dayjs';
import { safeStringify } from '@/utils/safeStringify';

import { validateListingSponsorAuth } from '@/features/auth/utils/checkListingSponsorAuth';
import { getSponsorSession } from '@/features/auth/utils/getSponsorSession';
import {
  addReferralInviterWinBonus,
  addWinBonusCredit,
  awardReferralFirstSubmissionBonusesForListing,
} from '@/features/credits/utils/allocateCredits';
import { queueEmail } from '@/features/emails/utils/queueEmail';
import { BONUS_REWARD_POSITION } from '@/features/listing-builder/constants';
import { calculateTotalPrizes } from '@/features/listing-builder/utils/rewards';
import { type Rewards } from '@/features/listings/types';
import { createPayment } from '@/features/listings/utils/createPayment';
import { checkKycCountryMatchesRegion } from '@/features/listings/utils/region';

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

    try {
      return await withRedisLock(
        `locks:announce-winners:${id}`,
        async () => {
          const listingAuthResult = await validateListingSponsorAuth(
            userSponsorId,
            id,
          );
          if ('error' in listingAuthResult) {
            return listingAuthResult.error;
          }
          const listing = listingAuthResult.listing;

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

          const winners = await prisma.submission.findMany({
            where: {
              listingId: id,
              isWinner: true,
              isActive: true,
              isArchived: false,
            },
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  isKYCVerified: true,
                  kycVerifiedAt: true,
                  kycCountry: true,
                },
              },
            },
          });

          const totalRewards = calculateTotalPrizes(
            listing.rewards as Rewards,
            listing.maxBonusSpots,
          );

          if (!!totalRewards && winners.length !== totalRewards) {
            const remainingSubmissions = await prisma.submission.count({
              where: {
                listingId: id,
                isWinner: false,
                isActive: true,
                isArchived: false,
              },
            });

            const rewards = listing.rewards as Rewards;
            const bonusReward = rewards[BONUS_REWARD_POSITION];
            const maxBonusSpots = listing.maxBonusSpots || 0;

            const bonusWinners = winners.filter(
              (w) => w.winnerPosition === BONUS_REWARD_POSITION,
            ).length;

            const remainingBonusSpots = bonusReward
              ? maxBonusSpots - bonusWinners
              : 0;

            const nonBonusWinners = winners.filter(
              (w) => w.winnerPosition !== BONUS_REWARD_POSITION,
            ).length;
            const totalNonBonusPositions =
              totalRewards - (bonusReward ? maxBonusSpots : 0);

            const allNonBonusPositionsFilled =
              nonBonusWinners === totalNonBonusPositions;
            const notEnoughSubmissionsForBonus =
              remainingBonusSpots > 0 && remainingSubmissions === 0;

            if (!(allNonBonusPositionsFilled && notEnoughSubmissionsForBonus)) {
              logger.warn(
                'All winners have not been selected before publishing the results',
              );
              return NextResponse.json(
                {
                  error:
                    'Please select all winners before publishing the results.',
                },
                { status: 400 },
              );
            }
            logger.info(
              `Allowing winner announcement with ${remainingBonusSpots} unfilled bonus positions due to only ${remainingSubmissions} submissions remaining`,
            );
          }

          const updatedRewards = { ...(listing.rewards as Rewards) };
          let updatedMaxBonusSpots = listing.maxBonusSpots || 0;
          let updatedRewardAmount = listing.rewardAmount || 0;
          let updatedUsdValue = listing.usdValue || 0;
          let recalculateUsd = false;

          if (updatedRewards[BONUS_REWARD_POSITION]) {
            const selectedBonusWinners = winners.filter(
              (w) => w.winnerPosition === BONUS_REWARD_POSITION,
            ).length;
            const originalMaxBonusSpots = updatedMaxBonusSpots;
            const bonusRewardValue = updatedRewards[
              BONUS_REWARD_POSITION
            ] as number;

            if (selectedBonusWinners === 0) {
              logger.info(
                `No bonus winners selected, removing bonus reward from listing ${id}`,
              );
              delete updatedRewards[BONUS_REWARD_POSITION];
              updatedMaxBonusSpots = 0;
              updatedRewardAmount -= bonusRewardValue * originalMaxBonusSpots;
              recalculateUsd = true;
            } else if (selectedBonusWinners < originalMaxBonusSpots) {
              logger.info(
                `${selectedBonusWinners} out of ${originalMaxBonusSpots} bonus winners selected, adjusting maxBonusSpots for listing ${id}`,
              );
              updatedMaxBonusSpots = selectedBonusWinners;
              updatedRewardAmount -=
                bonusRewardValue *
                (originalMaxBonusSpots - selectedBonusWinners);
              recalculateUsd = true;
            }
          }

          if (recalculateUsd && listing.token) {
            try {
              const tokenUsdValue: number | undefined = (listing as any)
                .tokenUsdAtPublish as number | undefined;
              if (typeof tokenUsdValue === 'number') {
                updatedUsdValue = updatedRewardAmount * tokenUsdValue;
              }
              logger.info(
                `Recalculated USD value for listing ${id}: ${updatedUsdValue} (token value: ${tokenUsdValue})`,
              );
            } catch (err) {
              logger.error(
                `Failed to recalculate USD value for listing ${id}`,
                err,
              );
            }
          }

          const deadline = dayjs().isAfter(listing?.deadline)
            ? listing?.deadline
            : dayjs().subtract(2, 'minute').toISOString();

          logger.debug('Updating bounty details with winner announcement');
          const updateResult = await prisma.bounties.updateMany({
            where: { id, isWinnersAnnounced: false },
            data: {
              isWinnersAnnounced: true,
              deadline,
              winnersAnnouncedAt: new Date().toISOString(),
              rewards: updatedRewards,
              maxBonusSpots: updatedMaxBonusSpots,
              rewardAmount: updatedRewardAmount,
              usdValue: updatedUsdValue,
            },
          });

          if (updateResult.count === 0) {
            logger.warn(
              `Winners already announced for bounty with ID: ${id} during update`,
            );
            return NextResponse.json(
              { error: `Winners already announced for bounty with id=${id}.` },
              { status: 409 },
            );
          }

          const updatedListing = await prisma.bounties.findUnique({
            where: { id },
            include: {
              sponsor: true,
            },
          });

          if (!updatedListing) {
            throw new Error(
              `Listing with id=${id} not found after winner announcement update`,
            );
          }

          const rewards: Rewards = updatedRewards;

          const promises = [];
          let currentIndex = 0;

          const winnerUserIds = winners.map((w) => w.userId);
          const referralMappings = await prisma.user.findMany({
            where: { id: { in: winnerUserIds } },
          });
          const userIdToInviterId = new Map<string, string | null>(
            referralMappings.map((u) => [
              u.id,
              (u as any).referredById ?? null,
            ]),
          );

          const baseRewardAmount = updatedListing.rewardAmount ?? 0;
          const baseUsdValue = updatedListing.usdValue ?? 0;

          while (currentIndex < winners?.length) {
            const winnerPosition = Number(
              winners[currentIndex]?.winnerPosition,
            );
            let amount: number = 0;
            if (winnerPosition && !isNaN(winnerPosition)) {
              amount = rewards[winnerPosition as keyof Rewards] ?? 0;
            }

            const rewardInUSD =
              baseRewardAmount > 0
                ? (baseUsdValue / baseRewardAmount) * amount
                : 0;

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

            promises.push(
              addWinBonusCredit(
                winners[currentIndex]?.userId || '',
                winners[currentIndex]?.id || '',
              ),
            );

            const inviterId = userIdToInviterId.get(
              winners[currentIndex]?.userId || '',
            );
            if (inviterId) {
              promises.push(
                addReferralInviterWinBonus(
                  inviterId,
                  winners[currentIndex]?.id || '',
                ),
              );
            }

            currentIndex += 1;
          }

          await Promise.all(promises);

          await awardReferralFirstSubmissionBonusesForListing(id);

          logger.info(
            `Applied spam penalties for submissions in listing ID: ${id}`,
          );

          waitUntil(
            (async () => {
              try {
                await earncognitoClient.post(`/discord/winners-announced`, {
                  listingId: updatedListing.id,
                });
              } catch (err) {
                logger.error('Discord Listing Update Message Error', err);
              }

              try {
                logger.info(
                  `Fetched ${winners.length} winners for bounty ID: ${id}`,
                );

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
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime()
                  );
                };

                const sortedWinners = winners
                  .filter((s) => s.winnerPosition !== BONUS_REWARD_POSITION)
                  .sort(sortSubmissions);

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
                logger.error(
                  'Failed to create winner announcement comment',
                  err,
                );
              }

              logger.debug('Sending winner announcement email notifications');
              await queueEmail({
                type: 'announceWinners',
                id,
                triggeredBy: userId,
              });

              if (listing.type !== 'project' && listing.isFndnPaying) {
                for (const winner of winners) {
                  const user = winner.user;
                  const isKycExpired =
                    !user.kycVerifiedAt ||
                    Date.now() - new Date(user.kycVerifiedAt).getTime() >
                      SIX_MONTHS;

                  if (
                    user.isKYCVerified &&
                    user.kycVerifiedAt &&
                    !isKycExpired
                  ) {
                    const kycCountryCheck = checkKycCountryMatchesRegion(
                      user.kycCountry,
                      listing.region,
                    );

                    if (!kycCountryCheck.isValid) {
                      logger.warn(
                        `Skipping payment sync to Airtable for winner ${winner.user.username} (submission ${winner.id}) because KYC country ${user.kycCountry} does not match listing region ${listing.region}`,
                      );
                      continue;
                    }

                    await createPayment({ userId: winner.userId });
                  } else {
                    logger.warn(
                      `Skipping payment info addition for winner ${winner.user.username} because they are not KYC verified`,
                    );
                  }
                }
                await queueEmail({
                  type: 'STWinners',
                  id,
                  triggeredBy: userId,
                });
              } else {
                await queueEmail({
                  type: 'nonSTWinners',
                  id,
                  triggeredBy: userId,
                });
              }

              try {
                await earncognitoClient.post(
                  `/airtable/sync-announced-listings`,
                  {
                    listingId: updatedListing.id,
                  },
                );
              } catch (err) {
                logger.error('Airatable Listing Sync Message Error', err);
              }

              logger.info(`ALl Non Blocking Tasks Triggered`);
            })(),
          );

          logger.info(`Winners announced successfully for bounty ID: ${id}`);
          return NextResponse.json({ message: 'Success' }, { status: 200 });
        },
        { ttlSeconds: 300 },
      );
    } catch (lockError) {
      if (lockError instanceof LockNotAcquiredError) {
        logger.warn(
          `Winner announcement already in progress for bounty ID: ${id}`,
        );
        return NextResponse.json(
          {
            error: `Winners announcement already in progress for bounty with id=${id}.`,
          },
          { status: 409 },
        );
      }
      throw lockError;
    }
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
