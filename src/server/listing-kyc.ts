import 'server-only';

import * as Clock from 'effect/Clock';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';
import * as Schema from 'effect/Schema';

import * as AppConfig from '@/server/app-config';
import * as Database from '@/server/database';
import * as Kyc from '@/server/kyc';
import { createPayments, KYC_PAYOUT_CUTOFF } from '@/server/listing-payments';
import * as Locks from '@/server/locks';

export class KycSubmissionNotFound extends Schema.TaggedError<KycSubmissionNotFound>()(
  'KycSubmissionNotFound',
  { slug: Schema.String },
) {
  override get message() {
    return `No submission of theirs on ${this.slug}`;
  }
}

// A winner who still has to verify their identity before the foundation
// pays them.
export interface PendingKyc {
  readonly submissionId: string;
  readonly listingTitle: string;
  readonly region: string;
}

export type VerifyResult = Kyc.Verification | { readonly notAllowed: true };

// Sumsub KYC for a bounty or hackathon winner the foundation pays, then
// their payment record (Earn's submission KYC).
export class ListingKyc extends Context.Service<
  ListingKyc,
  {
    // Sumsub's web SDK token, keyed by their Earn user id.
    readonly accessToken: (
      userId: string,
    ) => Effect.Effect<
      { readonly token: string; readonly userId: string },
      Kyc.KycUnavailable | Kyc.KycError
    >;
    // Their winning submission on the listing, when it waits for their KYC
    // (the listing page's 'Submit KYC').
    readonly pending: (
      userId: string,
      slug: string,
    ) => Effect.Effect<Option.Option<PendingKyc>, Database.DatabaseError>;
    // Earn's verify-completion: asks Sumsub; once verified, records their
    // KYC and, the first time, sends their winnings for payment.
    readonly verify: (
      userId: string,
      slug: string,
    ) => Effect.Effect<
      VerifyResult,
      | KycSubmissionNotFound
      | Kyc.KycUnavailable
      | Kyc.KycError
      | Locks.LockBusy
      | Database.DatabaseError
    >;
  }
>()('earn/ListingKyc') {}

// Earn's gate: a winner, announced after the cutoff, the foundation
// paying, not yet paid.
const allowed = (row: {
  readonly isWinner: boolean;
  readonly isPaid: boolean;
  readonly listing: {
    readonly isWinnersAnnounced: boolean;
    readonly isFndnPaying: boolean;
    readonly winnersAnnouncedAt: Date | null;
  };
}) =>
  row.isWinner &&
  row.listing.isWinnersAnnounced &&
  row.listing.isFndnPaying &&
  !row.isPaid &&
  !!row.listing.winnersAnnouncedAt &&
  row.listing.winnersAnnouncedAt > KYC_PAYOUT_CUTOFF;

const make = Effect.gen(function* () {
  const database = yield* Database.Database;
  const config = yield* AppConfig.AppConfig;
  const kyc = yield* Kyc.Kyc;
  const locks = yield* Locks.Locks;

  const submissionOf = (userId: string, slug: string) =>
    database.query('kycSubmission', (client) =>
      client.submission.findFirst({
        where: { userId, listing: { slug } },
        select: {
          id: true,
          isWinner: true,
          isPaid: true,
          listing: {
            select: {
              title: true,
              region: true,
              isWinnersAnnounced: true,
              isFndnPaying: true,
              winnersAnnouncedAt: true,
            },
          },
          user: { select: { isKYCVerified: true } },
        },
      }),
    );

  const accessToken = Effect.fn('ListingKyc.accessToken')(function* (
    userId: string,
  ) {
    const token = yield* kyc.accessToken(userId);
    return { token, userId };
  });

  const pending = Effect.fn('ListingKyc.pending')(function* (
    userId: string,
    slug: string,
  ) {
    const row = yield* submissionOf(userId, slug);
    if (!row || !allowed(row) || row.user.isKYCVerified) {
      return Option.none<PendingKyc>();
    }
    return Option.some({
      submissionId: row.id,
      listingTitle: row.listing.title,
      region: row.listing.region,
    });
  });

  const verify = Effect.fn('ListingKyc.verify')(function* (
    userId: string,
    slug: string,
  ) {
    const row = yield* submissionOf(userId, slug);
    if (!row) return yield* new KycSubmissionNotFound({ slug });
    if (!allowed(row)) return { notAllowed: true } as const;

    const applicant = yield* kyc.applicant(userId);
    const result = yield* kyc.verification(applicant.id);
    if (result !== 'verified') return result;

    yield* locks.with(
      `locks:create-payment:${userId}`,
      Effect.gen(function* () {
        const now = yield* Clock.currentTimeMillis;
        yield* database.query('recordKyc', (client) =>
          client.user.update({
            where: { id: userId },
            data: {
              isKYCVerified: true,
              kycName: applicant.fullName,
              kycCountry: applicant.country,
              kycDOB: applicant.dob,
              kycIDNumber: applicant.idNumber,
              kycIDType: applicant.idType,
              kycVerifiedAt: new Date(now),
            },
            select: { id: true },
          }),
        );
        if (!row.user.isKYCVerified) {
          yield* createPayments(database, config, userId);
        }
      }),
    );
    return result;
  });

  return ListingKyc.of({ accessToken, pending, verify });
});

export const layer = Layer.effect(ListingKyc, make);
