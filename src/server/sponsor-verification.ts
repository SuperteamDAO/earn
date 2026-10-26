import 'server-only';

import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';
import * as Schema from 'effect/Schema';

import type { Sponsors as SponsorRow } from '@/prisma/client';
import * as Database from '@/server/database';
import * as Earncognito from '@/server/earncognito';
import type * as Users from '@/server/users';

import { extractSocialUsername } from '@/features/social/utils/extractUsername';

export class InvalidVerification extends Schema.TaggedError<InvalidVerification>()(
  'InvalidVerification',
  {},
) {
  override get message() {
    return 'Invalid verification data';
  }
}

export class ListingNotFound extends Schema.TaggedError<ListingNotFound>()(
  'ListingNotFound',
  {},
) {
  override get message() {
    return 'Listing not found';
  }
}

export class NotVerifying extends Schema.TaggedError<NotVerifying>()(
  'NotVerifying',
  {},
) {
  override get message() {
    return 'Listing is not awaiting sponsor verification';
  }
}

const filled = Schema.String.check(Schema.isMinLength(1));

// Earn's sponsorVerificationSchema; `telegram` is the bare handle here and
// is stored as a t.me link.
const VerificationFields = Schema.Struct({
  superteamLead: filled,
  superteamName: Schema.NullOr(filled),
  fundingSource: filled,
  telegram: Schema.String.check(
    Schema.isMinLength(5),
    Schema.isMaxLength(32),
    Schema.isPattern(/^[a-zA-Z][a-zA-Z0-9_]*$/),
  ),
  commitToDeadline: Schema.Literals(['yes', 'no']),
  listingId: Schema.String,
});

export type VerificationBody = Readonly<Record<string, unknown>>;

function verificationFields(body: VerificationBody) {
  const telegram =
    typeof body.telegram === 'string'
      ? extractSocialUsername('telegram', body.telegram)
      : null;
  return Schema.decodeUnknownOption(VerificationFields)({
    ...body,
    telegram,
  }).pipe(
    Option.map((fields) => ({
      ...fields,
      telegram: `https://t.me/${fields.telegram}`,
    })),
  );
}

// A sponsor that isn't verified yet asks to publish a listing: the answers
// are kept on the sponsor, and earncognito asks the Superteam lead to vouch
// and posts the listing for review.
export class SponsorVerification extends Context.Service<
  SponsorVerification,
  {
    readonly submit: (
      writer: Users.SponsorWriter,
      body: VerificationBody,
    ) => Effect.Effect<
      SponsorRow,
      | InvalidVerification
      | ListingNotFound
      | NotVerifying
      | Database.DatabaseError
    >;
  }
>()('earn/SponsorVerification') {}

const make = Effect.gen(function* () {
  const database = yield* Database.Database;
  const earncognito = yield* Earncognito.Earncognito;

  const submit = Effect.fn('SponsorVerification.submit')(function* (
    writer: Users.SponsorWriter,
    body: VerificationBody,
  ) {
    const found = verificationFields(body);
    if (Option.isNone(found)) return yield* new InvalidVerification();
    const fields = found.value;

    const listing = yield* database.query('verifyingListing', (client) =>
      client.bounties.findFirst({
        where: { id: fields.listingId, sponsorId: writer.sponsorId },
        select: { status: true },
      }),
    );
    if (!listing) return yield* new ListingNotFound();
    if (listing.status !== 'VERIFYING') return yield* new NotVerifying();

    const sponsor = yield* database.query('sponsorVerificationInfo', (client) =>
      client.sponsors.update({
        where: { id: writer.sponsorId },
        data: { verificationInfo: fields },
      }),
    );

    const lead = {
      listingId: fields.listingId,
      superteamName: fields.superteamName,
      superteamLead: fields.superteamLead,
    };
    yield* earncognito
      // earncognito DMs the Superteam lead who is asked to vouch.
      .post('/telegram/verify-listing/dm-st', lead)
      .pipe(
        Effect.catch(() =>
          Effect.logError(
            'Failed to send Telegram vouch request to Superteam Lead',
          ),
        ),
        Effect.annotateLogs(lead),
      );
    yield* earncognito
      .post('/telegram/verify-listing', { listingId: fields.listingId })
      .pipe(
        Effect.catch(() =>
          Effect.logError('Failed to send Verification Message to discord'),
        ),
        Effect.annotateLogs({ listingId: fields.listingId }),
      );
    return sponsor;
  });

  return SponsorVerification.of({ submit });
});

export const layer = Layer.effect(SponsorVerification, make);
