import 'server-only';

import * as Clock from 'effect/Clock';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Random from 'effect/Random';
import * as Schema from 'effect/Schema';

import { SubmissionLabels, SubmissionStatus } from '@/prisma/enums';
import * as Credits from '@/server/credits';
import * as Database from '@/server/database';
import * as Earncognito from '@/server/earncognito';
import * as Locks from '@/server/locks';
import * as Queues from '@/server/queues';
import {
  type ListingNotFound,
  type NotYourListing,
  ownedListing,
  ReviewInvalid,
} from '@/server/review';
import * as ReviewAirtable from '@/server/review-airtable';
import * as ReviewBackground from '@/server/review-background';
import type * as Users from '@/server/users';

import {
  BONUS_POSITION,
  rewardsOf,
  totalPrizes,
} from '@/features/sponsor-dashboard/utils/review-rules';

export class AlreadyAnnounced extends Schema.TaggedError<AlreadyAnnounced>()(
  'AlreadyAnnounced',
  { listingId: Schema.String, inProgress: Schema.Boolean },
) {
  override get message() {
    return this.inProgress
      ? `Winners announcement already in progress for bounty with id=${this.listingId}.`
      : `Winners already announced for bounty with id=${this.listingId}.`;
  }
}

// Announcing a listing's winners (Earn's announce route): the listing closes
// with its results, winners are approved with their USD rewards and a bonus
// credit, and then, after the response, the comment, emails, Discord and the
// foundation's payment rows.
export class ReviewAnnounce extends Context.Service<
  ReviewAnnounce,
  {
    readonly announce: (
      writer: Users.SponsorWriter,
      listingId: string,
    ) => Effect.Effect<
      void,
      | AlreadyAnnounced
      | ReviewInvalid
      | ListingNotFound
      | NotYourListing
      | Database.DatabaseError
    >;
  }
>()('earn/ReviewAnnounce') {}

const make = Effect.gen(function* () {
  const database = yield* Database.Database;
  const credits = yield* Credits.Credits;
  const queues = yield* Queues.Queues;
  const locks = yield* Locks.Locks;
  const earncognito = yield* Earncognito.Earncognito;
  const airtable = yield* ReviewAirtable.ReviewAirtable;
  const background = yield* ReviewBackground.ReviewBackground;

  const announceLocked = (writer: Users.SponsorWriter, id: string) =>
    Effect.gen(function* () {
      const listing = yield* ownedListing(database, writer.sponsorId, id);
      if (listing.isWinnersAnnounced) {
        return yield* new ReviewInvalid({
          reason: `Winners already announced for bounty with id=${id}.`,
        });
      }
      if (!listing.isActive) {
        return yield* new ReviewInvalid({
          reason: `Bounty with id=${id} is not active.`,
        });
      }
      if (!listing.isPublished) {
        return yield* new ReviewInvalid({
          reason: `Bounty with id=${id} is not published.`,
        });
      }

      const winners = yield* database.query('announceWinners', (client) =>
        client.submission.findMany({
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
              },
            },
          },
        }),
      );

      const rewards = rewardsOf(listing.rewards);
      const maxBonusSpots = listing.maxBonusSpots;
      const bonusReward = rewards[String(BONUS_POSITION)];
      const bonusWinners = winners.filter(
        (winner) => winner.winnerPosition === BONUS_POSITION,
      ).length;
      const total = totalPrizes(rewards, maxBonusSpots);
      if (total && winners.length !== total) {
        // Every ranked place must be filled; bonus spots may stay open only
        // when nobody is left to give them to.
        const others = yield* database.query('announceOthers', (client) =>
          client.submission.count({
            where: {
              listingId: id,
              isWinner: false,
              isActive: true,
              isArchived: false,
            },
          }),
        );
        const openBonus = bonusReward ? maxBonusSpots - bonusWinners : 0;
        const allPlaces =
          winners.length - bonusWinners ===
          total - (bonusReward ? maxBonusSpots : 0);
        if (!(allPlaces && openBonus > 0 && others === 0)) {
          return yield* new ReviewInvalid({
            reason: 'Please select all winners before publishing the results.',
          });
        }
      }

      // Unfilled bonus spots come off the listing and its value.
      const updatedRewards: Record<string, number> = { ...rewards };
      let updatedMaxBonusSpots = maxBonusSpots;
      let updatedRewardAmount = listing.rewardAmount ?? 0;
      let updatedUsdValue = listing.usdValue ?? 0;
      if (bonusReward && bonusWinners < maxBonusSpots) {
        if (bonusWinners === 0) {
          delete updatedRewards[String(BONUS_POSITION)];
          updatedMaxBonusSpots = 0;
        } else {
          updatedMaxBonusSpots = bonusWinners;
        }
        updatedRewardAmount -= bonusReward * (maxBonusSpots - bonusWinners);
        if (listing.token && typeof listing.tokenUsdAtPublish === 'number') {
          updatedUsdValue = updatedRewardAmount * listing.tokenUsdAtPublish;
        }
      }

      const now = yield* Clock.currentTimeMillis;
      // Announcing early closes the listing a moment ago.
      const deadline =
        listing.deadline && now > listing.deadline.getTime()
          ? listing.deadline
          : new Date(now - 2 * 60 * 1000);

      const announced = yield* database.query('announce', (client) =>
        client.$transaction(async (tx) => {
          const update = await tx.bounties.updateMany({
            where: { id, isWinnersAnnounced: false },
            data: {
              isWinnersAnnounced: true,
              deadline,
              winnersAnnouncedAt: new Date(now),
              rewards: updatedRewards,
              maxBonusSpots: updatedMaxBonusSpots,
              rewardAmount: updatedRewardAmount,
              usdValue: updatedUsdValue,
            },
          });
          if (update.count === 0) return false;
          for (const winner of winners) {
            const amount = updatedRewards[String(winner.winnerPosition)] ?? 0;
            await tx.submission.update({
              where: { id: winner.id },
              data: {
                rewardInUSD:
                  updatedRewardAmount > 0
                    ? (updatedUsdValue / updatedRewardAmount) * amount
                    : 0,
                status: SubmissionStatus.Approved,
                label:
                  winner.label === SubmissionLabels.Unreviewed
                    ? SubmissionLabels.Reviewed
                    : winner.label,
              },
            });
          }
          return true;
        }),
      );
      if (!announced) {
        return yield* new AlreadyAnnounced({
          listingId: id,
          inProgress: false,
        });
      }
      yield* Effect.forEach(
        winners,
        (winner) =>
          credits
            .winBonus(winner.userId, winner.id)
            .pipe(
              Effect.catch(() =>
                Effect.logError('Win bonus credit failed').pipe(
                  Effect.annotateLogs({ submissionId: winner.id }),
                ),
              ),
            ),
        { discard: true },
      );

      // Ranked winners only, by place, tagged in one sentence.
      const ranked = winners
        .filter((winner) => winner.winnerPosition !== BONUS_POSITION)
        .toSorted(
          (a, b) =>
            (a.winnerPosition ?? Number.MAX_VALUE) -
            (b.winnerPosition ?? Number.MAX_VALUE),
        );
      const tags = ranked
        .map((winner, i) =>
          i > 0 && i === ranked.length - 1
            ? `and @${winner.user.username}`
            : `@${winner.user.username}`,
        )
        .join(ranked.length > 2 ? ', ' : ' ');
      const congratulate = yield* Random.nextBoolean;
      const comment = congratulate
        ? ranked.length === 1
          ? `Congratulations! ${tags} has been announced as the winner!`
          : `Congratulations! ${tags} have been announced as the winners!`
        : listing.type === 'bounty'
          ? `Applaud ${tags} for winning this Bounty`
          : 'Winners have been announced. ';

      const followUp = Effect.gen(function* () {
        yield* earncognito
          .post('/discord/winners-announced', { listingId: id })
          .pipe(
            Effect.catch(() =>
              Effect.logError('Discord winners announcement failed'),
            ),
          );
        yield* database
          .query('winnerComment', (client) =>
            client.comment.create({
              data: {
                authorId: writer.userId,
                refId: id,
                refType: 'BOUNTY',
                message: comment,
                type: 'WINNER_ANNOUNCEMENT',
              },
            }),
          )
          .pipe(
            Effect.catch(() =>
              Effect.logError('Winner announcement comment failed'),
            ),
          );
        yield* queues.email({ type: 'announceWinners', id });
        if (listing.isFndnPaying) {
          yield* Effect.forEach(
            winners.filter(
              (winner) =>
                winner.user.isKYCVerified && winner.user.kycVerifiedAt,
            ),
            (winner) => airtable.fileWinnerPayments(winner.userId),
            { discard: true },
          );
          yield* queues.email({ type: 'STWinners', id });
        } else {
          yield* queues.email({ type: 'nonSTWinners', id });
        }
      }).pipe(Effect.annotateLogs({ listingId: id }));
      return yield* background.run(followUp);
    });

  const announce = Effect.fn('ReviewAnnounce.announce')(function* (
    writer: Users.SponsorWriter,
    listingId: string,
  ) {
    yield* locks
      .with(
        `locks:announce-winners:${listingId}`,
        announceLocked(writer, listingId),
      )
      .pipe(
        Effect.catchTag('LockBusy', () =>
          Effect.fail(new AlreadyAnnounced({ listingId, inProgress: true })),
        ),
      );
  });

  return ReviewAnnounce.of({ announce });
});

export const layer = Layer.effect(ReviewAnnounce, make);
