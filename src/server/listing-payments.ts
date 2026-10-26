import 'server-only';

import lookup from 'country-code-lookup';
import * as Effect from 'effect/Effect';
import * as Redacted from 'effect/Redacted';
import * as Schema from 'effect/Schema';

import type * as AppConfig from '@/server/app-config';
import type * as Database from '@/server/database';
import { chapterRegions, regionForLocation } from '@/server/listing-regions';
import { getRankLabels } from '@/utils/rank';

// Only listings announced after this go through the foundation's KYC'd
// payout (Earn's ANNOUNCEMENT_CUTOFF_DATE).
export const KYC_PAYOUT_CUTOFF = new Date('2025-08-06');

export class AirtableError extends Schema.TaggedError<AirtableError>()(
  'AirtableError',
  { operation: Schema.String, cause: Schema.Defect() },
) {
  override get message() {
    return `Airtable request failed: ${this.operation}`;
  }
}

// The Airtable payment record's fields, as Earn's addPaymentInfoToAirtable
// writes them (the payments team reads these names).
export interface PaymentFields {
  readonly Name: string;
  readonly Address: string;
  readonly 'Date of Birth': string;
  readonly 'ID Number': string;
  readonly 'ID Type': string;
  readonly 'Country of Residence': string;
  readonly Amount: number;
  readonly 'Wallet Address': string;
  readonly Category: ReadonlyArray<string>;
  readonly 'Purpose of Payment': string;
  readonly 'Project (Archive)': string;
  readonly Email: string;
  readonly Status: string;
  readonly Region: ReadonlyArray<string>;
  readonly Approver: ReadonlyArray<string>;
  readonly earnApplicationId: string;
  readonly 'Discord / Earn Username': string;
}

export interface PayableSubmission {
  readonly id: string;
  readonly winnerPosition: number;
  readonly listing: {
    readonly title: string;
    readonly rewards: Record<string, number>;
    readonly type: 'bounty' | 'hackathon';
    readonly slug: string;
  };
  readonly user: {
    readonly email: string;
    readonly username: string;
    readonly walletAddress: string;
    readonly kycName: string;
    readonly kycAddress: string | null;
    readonly kycDOB: string;
    readonly kycIDNumber: string;
    readonly kycIDType: string;
    readonly kycCountry: string;
  };
}

// Airtable's Category record for the listing's type, live or test base.
const categoryOf = (type: 'bounty' | 'hackathon', production: boolean) =>
  type === 'bounty'
    ? production
      ? 'recVJBMFEtm3Fj4Rg'
      : 'rec3Z9YjIC94bWD1n'
    : production
      ? 'rec03uWVyyixPpSVM'
      : 'rec8j28zCH5yl2r5T';

export function paymentFields(
  submission: PayableSubmission,
  regionRecordId: string,
  production: boolean,
): PaymentFields {
  const { user, listing } = submission;
  const country = lookup.byIso(user.kycCountry)?.country;
  const rank = getRankLabels(submission.winnerPosition)?.toUpperCase();
  const listingUrl = `https://superteam.fun/earn/listing/${listing.slug}`;
  return {
    Name: user.kycName,
    Address: user.kycAddress ?? '',
    'Date of Birth': user.kycDOB,
    'ID Number': user.kycIDNumber,
    'ID Type': user.kycIDType,
    'Country of Residence': country || user.kycCountry,
    Amount: listing.rewards[String(submission.winnerPosition)] ?? 0,
    'Wallet Address': user.walletAddress,
    Category: [categoryOf(listing.type, production)],
    'Purpose of Payment': `${rank} in ${listing.title} (${listingUrl}) — ${user.email}`,
    'Project (Archive)': listing.title,
    Email: user.email,
    Status: 'Verified',
    Region: [regionRecordId],
    Approver: ['Pratik Dholani'],
    earnApplicationId: submission.id,
    'Discord / Earn Username': user.username,
  };
}

// Airtable's payments region names differ from Earn's in one place.
const paymentsRegionName = (region: string) =>
  region.trim().toLowerCase() === 'united arab emirates' ? 'UAE' : region;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const asRewards = (value: unknown): Record<string, number> | null => {
  if (!isRecord(value) || Array.isArray(value)) return null;
  const rewards: Record<string, number> = {};
  for (const [key, amount] of Object.entries(value)) {
    if (typeof amount === 'number') rewards[key] = amount;
  }
  return rewards;
};

const filled = (value: string | null | undefined): value is string =>
  typeof value === 'string' && value.length > 0;

// Why a winning submission can't be sent for payment yet, or what to send
// (Earn's createPayment checks, then addPaymentInfoToAirtable's schema).
export function payable(row: {
  readonly id: string;
  readonly winnerPosition: number | null;
  readonly listing: {
    readonly title: string;
    readonly rewards: unknown;
    readonly type: string;
    readonly slug: string;
  };
  readonly user: {
    readonly isKYCVerified: boolean;
    readonly email: string;
    readonly username: string | null;
    readonly walletAddress: string | null;
    readonly kycName: string | null;
    readonly kycAddress: string | null;
    readonly kycDOB: string | null;
    readonly kycIDNumber: string | null;
    readonly kycIDType: string | null;
    readonly kycCountry: string | null;
  };
}): PayableSubmission | string {
  const { user, listing } = row;
  if (!user.isKYCVerified) return 'User is not verified';
  const rewards = asRewards(listing.rewards);
  if (!rewards) return 'Invalid rewards structure';
  if (!user.walletAddress) return 'Wallet address is required';
  if (!user.username) return 'Username is required';
  if (
    !filled(user.kycName) ||
    !filled(user.kycCountry) ||
    !filled(user.kycDOB) ||
    !filled(user.kycIDNumber) ||
    !filled(user.kycIDType)
  ) {
    return 'Complete KYC information is required';
  }
  if (row.winnerPosition === null) return 'Winner position is required';
  if (listing.type !== 'bounty' && listing.type !== 'hackathon') {
    return `Listing type "${listing.type}" is not supported for payment.`;
  }
  if (user.kycCountry.length !== 3 || !lookup.byIso(user.kycCountry)) {
    return 'Invalid KYC Country ISO code';
  }
  if (!listing.title || !listing.slug) return 'Listing title and slug needed';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) return 'Invalid email';
  return {
    id: row.id,
    winnerPosition: row.winnerPosition,
    listing: {
      title: listing.title,
      rewards,
      type: listing.type,
      slug: listing.slug,
    },
    user: {
      email: user.email,
      username: user.username,
      walletAddress: user.walletAddress,
      kycName: user.kycName,
      kycAddress: user.kycAddress,
      kycDOB: user.kycDOB,
      kycIDNumber: user.kycIDNumber,
      kycIDType: user.kycIDType,
      kycCountry: user.kycCountry,
    },
  };
}

// Earn's createPayment: every winning submission of theirs the foundation
// pays and that isn't in Airtable yet goes into the payments table, then is
// marked synced. A submission that can't is logged and skipped, as Earn does.
export const createPayments = Effect.fn('ListingPayments.createPayments')(
  function* (
    database: Database.Database['Service'],
    config: AppConfig.AppConfig['Service'],
    userId: string,
  ) {
    const rows = yield* database.query('payableSubmissions', (client) =>
      client.submission.findMany({
        where: {
          userId,
          paymentSynced: false,
          winnerPosition: { not: null },
          listing: {
            type: { in: ['bounty', 'hackathon'] },
            isWinnersAnnounced: true,
            isFndnPaying: true,
            winnersAnnouncedAt: { gte: KYC_PAYOUT_CUTOFF },
          },
        },
        select: {
          id: true,
          winnerPosition: true,
          listing: {
            select: { title: true, rewards: true, type: true, slug: true },
          },
          user: {
            select: {
              isKYCVerified: true,
              email: true,
              username: true,
              location: true,
              walletAddress: true,
              kycName: true,
              kycAddress: true,
              kycDOB: true,
              kycIDNumber: true,
              kycIDType: true,
              kycCountry: true,
            },
          },
        },
      }),
    );
    if (rows.length === 0) return { processed: 0 };

    const airtable = config.airtable;
    const base = airtable?.paymentsBase;
    const table = airtable?.paymentsTable;
    const regionsTable = airtable?.paymentsRegionsTable;
    if (!airtable || !base || !table || !regionsTable) {
      yield* Effect.logError('Airtable payments not configured; skipped');
      return { processed: 0 };
    }
    const headers = {
      Authorization: `Bearer ${Redacted.value(airtable.token)}`,
      'Content-Type': 'application/json',
    };
    const url = (name: string) =>
      `https://api.airtable.com/v0/${base}/${encodeURIComponent(name)}`;
    const call = (operation: string, target: string, init?: RequestInit) =>
      Effect.tryPromise({
        try: async () => {
          const response = await fetch(target, {
            ...init,
            headers,
            signal: AbortSignal.timeout(15_000),
          });
          if (!response.ok) throw new Error(`Airtable ${response.status}`);
          const body: unknown = await response.json();
          return body;
        },
        catch: (cause) => new AirtableError({ operation, cause }),
      });
    const firstId = (operation: string, name: string, formula: string) => {
      const target = new URL(url(name));
      target.searchParams.set('filterByFormula', formula);
      target.searchParams.set('maxRecords', '1');
      return call(operation, target.toString()).pipe(
        Effect.map((body) => {
          const records =
            isRecord(body) && Array.isArray(body.records) ? body.records : [];
          const first: unknown = records[0];
          return isRecord(first) && typeof first.id === 'string'
            ? first.id
            : null;
        }),
      );
    };

    const chapters = yield* chapterRegions(database);
    let processed = 0;
    for (const row of rows) {
      const submission = payable(row);
      if (typeof submission === 'string') {
        yield* Effect.logError('Submission not payable').pipe(
          Effect.annotateLogs({ submissionId: row.id, reason: submission }),
        );
        continue;
      }
      const synced = yield* Effect.gen(function* () {
        const existing = yield* firstId(
          'existingPayment',
          table,
          `AND({earnApplicationId}='${submission.id}')`,
        );
        if (!existing) {
          const regionName = paymentsRegionName(
            regionForLocation(row.user.location, chapters),
          );
          const regionId = yield* firstId(
            'paymentRegion',
            regionsTable,
            `{Country} = '${regionName}'`,
          );
          if (!regionId) {
            return yield* new AirtableError({
              operation: 'paymentRegion',
              cause: `no region ${regionName}`,
            });
          }
          yield* call('insertPayment', url(table), {
            method: 'POST',
            body: JSON.stringify({
              records: [
                {
                  fields: paymentFields(
                    submission,
                    regionId,
                    config.earnProduction,
                  ),
                },
              ],
              typecast: true,
            }),
          });
        }
        yield* database.query('markPaymentSynced', (client) =>
          client.submission.update({
            where: { id: submission.id },
            data: { paymentSynced: true },
            select: { id: true },
          }),
        );
        return true;
      }).pipe(
        Effect.catchTag('AirtableError', (error) =>
          Effect.logError('Adding payment to Airtable failed').pipe(
            Effect.annotateLogs({
              submissionId: submission.id,
              operation: error.operation,
            }),
            Effect.as(false),
          ),
        ),
      );
      if (synced) processed += 1;
    }
    return { processed };
  },
);
