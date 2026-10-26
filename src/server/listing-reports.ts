import 'server-only';

import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';
import * as Schema from 'effect/Schema';

import * as Database from '@/server/database';
import * as Earncognito from '@/server/earncognito';
import * as RateLimits from '@/server/rate-limits';

// What the report form sends (Earn's reportListingSchema). The reporter's
// email is the account's, whatever the form says.
export const ReportPayload = Schema.Struct({
  listingTitle: Schema.NonEmptyString,
  listingUrl: Schema.String.check(
    Schema.makeFilter(
      (value) => URL.canParse(value) || 'A valid listing URL is required',
    ),
  ),
  reasonTitle: Schema.NonEmptyString,
  userEmail: Schema.optional(Schema.String),
  reasonSubtext: Schema.optional(Schema.String),
});

export class InvalidReport extends Schema.TaggedError<InvalidReport>()(
  'InvalidReport',
  {},
) {
  override get message() {
    return 'Invalid report payload';
  }
}

export class ReporterWithoutEmail extends Schema.TaggedError<ReporterWithoutEmail>()(
  'ReporterWithoutEmail',
  {},
) {
  override get message() {
    return 'Reporter has no email';
  }
}

// Reports a listing to the moderators' Telegram, through earncognito.
export class ListingReports extends Context.Service<
  ListingReports,
  {
    readonly report: (
      userId: string,
      payload: unknown,
    ) => Effect.Effect<
      void,
      | RateLimits.RateLimited
      | ReporterWithoutEmail
      | InvalidReport
      | Earncognito.EarncognitoError
      | Database.DatabaseError
    >;
  }
>()('earn/ListingReports') {}

const make = Effect.gen(function* () {
  const database = yield* Database.Database;
  const limits = yield* RateLimits.RateLimits;
  const earncognito = yield* Earncognito.Earncognito;

  const report = Effect.fn('ListingReports.report')(function* (
    userId: string,
    payload: unknown,
  ) {
    yield* limits.check('reportListing', userId);
    const user = yield* database.query('reporter', (client) =>
      client.user.findUnique({
        where: { id: userId },
        select: { email: true },
      }),
    );
    if (!user?.email) return yield* new ReporterWithoutEmail();
    const decoded = Schema.decodeUnknownOption(ReportPayload)(payload);
    if (Option.isNone(decoded)) return yield* new InvalidReport();
    return yield* earncognito
      .post('/telegram/report-listing', {
        ...decoded.value,
        userEmail: user.email,
      })
      .pipe(Effect.asVoid);
  });

  return ListingReports.of({ report });
});

export const layer = Layer.effect(ListingReports, make);
