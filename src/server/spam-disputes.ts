import 'server-only';

import * as Clock from 'effect/Clock';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Schema from 'effect/Schema';

import { CreditEventType } from '@/prisma/enums';
import * as Credits from '@/server/credits';
import * as Database from '@/server/database';
import * as Earncognito from '@/server/earncognito';

const DAY_MS = 24 * 60 * 60 * 1000;
// A spam penalty may be disputed for this many days.
const DISPUTE_DAYS = 7;

export class DisputeRefused extends Schema.TaggedError<DisputeRefused>()(
  'DisputeRefused',
  { reason: Schema.Literals(['duplicate', 'no-penalty', 'expired']) },
) {
  override get message() {
    return `Dispute refused: ${this.reason}`;
  }
}

export interface DisputeInput {
  readonly description: string;
  // 'GRANT' for a grant application; anything else is a bounty submission.
  readonly listingType: string;
  // The submission's id, or the grant application's.
  readonly submissionId: string;
}

// Talent disputing a spam penalty, as Earn's /api/spam-dispute did: one
// dispute per penalty, within a week of it. earncognito posts it to the
// team's Telegram, and a pending dispute goes on the ledger for earncognito
// to decide.
export class SpamDisputes extends Context.Service<
  SpamDisputes,
  {
    readonly dispute: (
      userId: string,
      input: DisputeInput,
    ) => Effect.Effect<
      void,
      DisputeRefused | Earncognito.EarncognitoError | Database.DatabaseError
    >;
  }
>()('earn/SpamDisputes') {}

const make = Effect.gen(function* () {
  const database = yield* Database.Database;
  const credits = yield* Credits.Credits;
  const earncognito = yield* Earncognito.Earncognito;

  const dispute = Effect.fn('SpamDisputes.dispute')(function* (
    userId: string,
    { description, listingType, submissionId }: DisputeInput,
  ) {
    const isGrant = listingType === 'GRANT';
    const byId = isGrant ? { applicationId: submissionId } : { submissionId };

    const existing = yield* database.query('existingDispute', (client) =>
      client.creditLedger.findFirst({
        where: {
          ...byId,
          userId,
          type: {
            in: [
              CreditEventType.SPAM_DISPUTE,
              CreditEventType.GRANT_SPAM_DISPUTE,
            ],
          },
        },
        select: { id: true },
      }),
    );
    if (existing) return yield* new DisputeRefused({ reason: 'duplicate' });

    const penalty = yield* database.query('spamPenalty', (client) =>
      client.creditLedger.findFirst({
        where: {
          ...byId,
          userId,
          type: {
            in: [
              CreditEventType.SPAM_PENALTY,
              CreditEventType.GRANT_SPAM_PENALTY,
            ],
          },
        },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),
    );
    if (!penalty) return yield* new DisputeRefused({ reason: 'no-penalty' });

    const now = yield* Clock.currentTimeMillis;
    const days = Math.floor((now - penalty.createdAt.getTime()) / DAY_MS);
    if (days > DISPUTE_DAYS) {
      return yield* new DisputeRefused({ reason: 'expired' });
    }

    const [user, listing] = yield* Effect.all([
      database.query('disputeUser', (client) =>
        client.user.findUnique({
          where: { id: userId },
          select: { email: true },
        }),
      ),
      isGrant
        ? database
            .query('disputedApplication', (client) =>
              client.grantApplication.findFirst({
                where: { id: submissionId, userId },
                select: { grant: { select: { title: true, slug: true } } },
              }),
            )
            .pipe(
              Effect.map((application) => ({
                title: application?.grant.title,
                url: `https://superteam.fun/earn/grants/${application?.grant.slug}`,
              })),
            )
        : database
            .query('disputedSubmission', (client) =>
              client.submission.findFirst({
                where: { id: submissionId, userId },
                select: { listing: { select: { title: true, slug: true } } },
              }),
            )
            .pipe(
              Effect.map((submission) => ({
                title: submission?.listing.title,
                url: `https://superteam.fun/earn/listing/${submission?.listing.slug}`,
              })),
            ),
    ]);

    // earncognito's /telegram/spam-dispute payload: keep its shape.
    yield* earncognito.post('/telegram/spam-dispute', {
      listingTitle: listing.title,
      listingUrl: listing.url,
      description,
      userEmail: user?.email,
      submissionId,
      listingType,
    });

    return yield* credits.dispute(
      userId,
      isGrant ? 'application' : 'submission',
      submissionId,
    );
  });

  return SpamDisputes.of({ dispute });
});

export const layer = Layer.effect(SpamDisputes, make);
