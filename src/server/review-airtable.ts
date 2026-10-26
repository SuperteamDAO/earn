import 'server-only';

import lookup from 'country-code-lookup';
import * as Context from 'effect/Context';
import * as Duration from 'effect/Duration';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';
import * as Redacted from 'effect/Redacted';
import * as Schema from 'effect/Schema';

import * as AppConfig from '@/server/app-config';
import * as Database from '@/server/database';

import { rewardsOf } from '@/features/sponsor-dashboard/utils/review-rules';

class AirtableFailed extends Schema.TaggedError<AirtableFailed>()(
  'AirtableFailed',
  { operation: Schema.String, cause: Schema.Defect() },
) {
  override get message() {
    return `Airtable request failed: ${this.operation}`;
  }
}

// The foundation pays winners of listings it pays for from rows in its
// Airtable payments table: one per winning submission, written once the
// winner is KYC verified (Earn's createPayment and addPaymentInfoToAirtable).
export class ReviewAirtable extends Context.Service<
  ReviewAirtable,
  {
    // Files every winning submission of theirs still unfiled. Never fails:
    // what can't be filed is logged and stays unfiled for the next try.
    readonly fileWinnerPayments: (userId: string) => Effect.Effect<void>;
  }
>()('earn/ReviewAirtable') {}

// Earn files payments only for listings announced from this day.
const ANNOUNCEMENT_CUTOFF = new Date('2025-08-06');

const RANKS = [
  'zeroth',
  'first',
  'second',
  'third',
  'fourth',
  'fifth',
  'sixth',
  'seventh',
  'eighth',
  'ninth',
  'tenth',
  'eleventh',
  'twelfth',
  'thirteenth',
  'fourteenth',
  'fifteenth',
  'sixteenth',
  'seventeenth',
  'eighteenth',
  'nineteenth',
  'twentieth',
  'twentyFirst',
  'twentySecond',
  'twentyThird',
  'twentyFourth',
  'twentyFifth',
  'twentySixth',
  'twentySeventh',
  'twentyEighth',
  'twentyNinth',
  'thirtieth',
  'thirtyFirst',
  'thirtySecond',
  'thirtyThird',
  'thirtyFourth',
  'thirtyFifth',
  'thirtySixth',
  'thirtySeventh',
  'thirtyEighth',
  'thirtyNinth',
  'fortieth',
  'fortyFirst',
  'fortySecond',
  'fortyThird',
  'fortyFourth',
  'fortyFifth',
  'fortySixth',
  'fortySeventh',
  'fortyEighth',
  'fortyNinth',
  'fiftieth',
];

// Earn's getRankLabels.
const rankLabel = (position: number) =>
  position === 99 ? 'bonus' : RANKS[position];

// Earn's payments categories, live and test.
const CATEGORY = {
  bounty: { live: 'recVJBMFEtm3Fj4Rg', test: 'rec3Z9YjIC94bWD1n' },
  hackathon: { live: 'rec03uWVyyixPpSVM', test: 'rec8j28zCH5yl2r5T' },
} as const;

const Records = Schema.Struct({
  records: Schema.Array(Schema.Struct({ id: Schema.String })),
});

// Formulas take quoted values; a quote in one would end it early.
const quoted = (value: string) =>
  `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

const same = (a: string | null | undefined, b: string) =>
  (a ?? '').trim().toLowerCase() === b;

const tableUrl = (base: string, table: string) =>
  `https://api.airtable.com/v0/${base}/${encodeURIComponent(table)}`;

const request = (
  operation: string,
  token: Redacted.Redacted,
  url: string,
  body?: unknown,
) =>
  Effect.tryPromise({
    try: async () => {
      const response = await fetch(url, {
        method: body === undefined ? 'GET' : 'POST',
        headers: {
          Authorization: `Bearer ${Redacted.value(token)}`,
          'Content-Type': 'application/json',
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(15_000),
      });
      if (!response.ok) throw new Error(`Airtable ${response.status}`);
      return (await response.json()) as unknown;
    },
    catch: (cause) => new AirtableFailed({ operation, cause }),
  });

const findRecord = (
  operation: string,
  token: Redacted.Redacted,
  url: string,
  formula: string,
) =>
  request(
    operation,
    token,
    `${url}?${new URLSearchParams({ filterByFormula: formula, maxRecords: '1' })}`,
  ).pipe(
    Effect.map((body) =>
      Schema.decodeUnknownOption(Records)(body).pipe(
        Option.flatMap((data) => Option.fromNullishOr(data.records[0]?.id)),
        Option.getOrNull,
      ),
    ),
  );

const make = Effect.gen(function* () {
  const config = yield* AppConfig.AppConfig;
  const database = yield* Database.Database;
  const airtable = config.airtable;

  // Superteam's chapters, to place a winner in a region as Earn does.
  const [chapters] = yield* Effect.cachedInvalidateWithTTL(
    database.query('paymentChapters', (client) =>
      client.chapter.findMany({
        where: { active: true },
        select: {
          region: true,
          name: true,
          displayValue: true,
          countries: true,
        },
      }),
    ),
    Duration.minutes(5),
  );

  // Earn's getRegionNameForLocation.
  const regionNameOf = (location: string | null) =>
    Effect.gen(function* () {
      const wanted = (location ?? '').trim().toLowerCase();
      if (!wanted) return 'Global';
      const found = (yield* chapters).find(
        (chapter) =>
          same(chapter.region, wanted) ||
          same(chapter.displayValue ?? chapter.region, wanted) ||
          same(chapter.name, wanted) ||
          (Array.isArray(chapter.countries) &&
            chapter.countries.some(
              (country) => typeof country === 'string' && same(country, wanted),
            )),
      );
      return found?.region ?? 'Global';
    });

  const winningSubmissions = (userId: string) =>
    database.query('unsyncedWinnerPayments', (client) =>
      client.submission.findMany({
        where: {
          userId,
          paymentSynced: false,
          winnerPosition: { not: null },
          listing: {
            type: { in: ['bounty', 'hackathon'] },
            isWinnersAnnounced: true,
            isFndnPaying: true,
            winnersAnnouncedAt: { gte: ANNOUNCEMENT_CUTOFF },
          },
        },
        select: {
          id: true,
          winnerPosition: true,
          listing: {
            select: {
              title: true,
              rewards: true,
              type: true,
              slug: true,
            },
          },
          user: {
            select: {
              walletAddress: true,
              email: true,
              username: true,
              location: true,
              kycName: true,
              kycAddress: true,
              kycDOB: true,
              kycIDNumber: true,
              kycIDType: true,
              kycCountry: true,
              isKYCVerified: true,
            },
          },
        },
      }),
    );

  type Winning = Effect.Success<ReturnType<typeof winningSubmissions>>[number];

  const file = (submission: Winning) =>
    Effect.gen(function* () {
      const base = airtable?.paymentsBase;
      const table = airtable?.paymentsTable;
      const regions = airtable?.paymentsRegionsTable;
      if (!airtable || !base || !table || !regions) {
        return yield* new AirtableFailed({
          operation: 'check',
          cause: 'payments tables not configured',
        });
      }
      // Earn's checks before a payment is filed.
      const { user, listing } = submission;
      const country = user.kycCountry ? lookup.byIso(user.kycCountry) : null;
      if (
        !user.isKYCVerified ||
        !user.walletAddress ||
        !user.username ||
        !user.kycName ||
        !user.kycDOB ||
        !user.kycIDNumber ||
        !user.kycIDType ||
        user.kycCountry?.length !== 3 ||
        !country ||
        submission.winnerPosition === null ||
        !listing.title ||
        !listing.slug ||
        (listing.type !== 'bounty' && listing.type !== 'hackathon')
      ) {
        return yield* new AirtableFailed({
          operation: 'check',
          cause: 'payment details incomplete',
        });
      }
      const paymentsUrl = tableUrl(base, table);
      const existing = yield* findRecord(
        'existingPayment',
        airtable.token,
        paymentsUrl,
        `AND({earnApplicationId}=${quoted(submission.id)})`,
      );
      if (!existing) {
        const chapterRegion = yield* regionNameOf(user.location);
        const regionName =
          chapterRegion.trim().toLowerCase() === 'united arab emirates'
            ? 'UAE'
            : chapterRegion;
        const region = yield* findRecord(
          'paymentRegion',
          airtable.token,
          tableUrl(base, regions),
          `{Country} = ${quoted(regionName)}`,
        );
        if (!region) {
          return yield* new AirtableFailed({
            operation: 'check',
            cause: 'payment region not found',
          });
        }
        const listingUrl = `https://superteam.fun/earn/listing/${listing.slug}`;
        const rank = rankLabel(submission.winnerPosition)?.toUpperCase();
        yield* request('addPayment', airtable.token, paymentsUrl, {
          typecast: true,
          records: [
            {
              fields: {
                Name: user.kycName,
                Address: user.kycAddress ?? '',
                'Date of Birth': user.kycDOB,
                'ID Number': user.kycIDNumber,
                'ID Type': user.kycIDType,
                'Country of Residence': country.country || user.kycCountry,
                Amount:
                  rewardsOf(listing.rewards)[
                    String(submission.winnerPosition)
                  ] ?? 0,
                'Wallet Address': user.walletAddress,
                Category: [
                  CATEGORY[listing.type][
                    config.earnProduction ? 'live' : 'test'
                  ],
                ],
                'Purpose of Payment': `${rank} in ${listing.title} (${listingUrl}) — ${user.email}`,
                'Project (Archive)': listing.title,
                Email: user.email,
                Status: 'Verified',
                Region: [region],
                Approver: ['Pratik Dholani'],
                earnApplicationId: submission.id,
                'Discord / Earn Username': user.username,
              },
            },
          ],
        });
      }
      return yield* database.query('markPaymentSynced', (client) =>
        client.submission.update({
          where: { id: submission.id },
          data: { paymentSynced: true },
        }),
      );
    }).pipe(
      Effect.catch(() =>
        Effect.logError('Filing a winner payment failed').pipe(
          Effect.annotateLogs({ submissionId: submission.id }),
        ),
      ),
    );

  const fileWinnerPayments = (userId: string) =>
    winningSubmissions(userId).pipe(
      Effect.flatMap((submissions) =>
        Effect.forEach(submissions, file, { discard: true }),
      ),
      Effect.catch(() =>
        Effect.logError('Loading winner payments failed').pipe(
          Effect.annotateLogs({ userId }),
        ),
      ),
    );

  return ReviewAirtable.of({ fileWinnerPayments });
});

export const layer = Layer.effect(ReviewAirtable, make);
