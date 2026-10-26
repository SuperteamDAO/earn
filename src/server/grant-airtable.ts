import 'server-only';

import lookup from 'country-code-lookup';
import * as Context from 'effect/Context';
import * as Duration from 'effect/Duration';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';
import * as Redacted from 'effect/Redacted';
import * as Schema from 'effect/Schema';
import TurndownService from 'turndown';

import * as AppConfig from '@/server/app-config';
import * as Database from '@/server/database';

// A grant application as the foundation's Airtable takes it.
export interface AirtableApplication {
  readonly id: string;
  readonly applicationStatus: string;
  readonly projectTitle: string;
  readonly projectOneLiner: string;
  readonly projectDetails: string;
  readonly projectTimeline: string;
  readonly proofOfWork: string;
  readonly milestones: string | null;
  readonly kpi: string | null;
  readonly twitter: string | null;
  readonly walletAddress: string;
  readonly ask: number;
  readonly approvedAmount: number;
  readonly createdAt: Date;
  readonly user: {
    readonly firstName: string | null;
    readonly lastName: string | null;
    readonly email: string;
    readonly discord: string | null;
    readonly location?: string | null;
  };
  readonly grant: {
    readonly airtableId: string | null;
    readonly title: string;
  };
}

// The select that gives an AirtableApplication.
export const AIRTABLE_APPLICATION = {
  id: true,
  applicationStatus: true,
  projectTitle: true,
  projectOneLiner: true,
  projectDetails: true,
  projectTimeline: true,
  proofOfWork: true,
  milestones: true,
  kpi: true,
  twitter: true,
  walletAddress: true,
  ask: true,
  approvedAmount: true,
  createdAt: true,
  user: {
    select: {
      firstName: true,
      lastName: true,
      email: true,
      discord: true,
      location: true,
    },
  },
  grant: { select: { airtableId: true, title: true } },
} as const;

// What a tranche's payment record needs: the KYC'd identity.
export interface PaymentApplication {
  readonly id: string;
  readonly walletAddress: string;
  readonly projectTitle: string;
  readonly projectOneLiner: string;
  readonly user: {
    readonly email: string;
    readonly username: string | null;
    readonly location: string | null;
    readonly kycName: string | null;
    readonly kycAddress: string | null;
    readonly kycDOB: string | null;
    readonly kycIDNumber: string | null;
    readonly kycIDType: string | null;
    readonly kycCountry: string | null;
  };
  readonly grant: {
    readonly approverRecordId: string | null;
    readonly title: string;
  };
}

export const PAYMENT_APPLICATION = {
  id: true,
  walletAddress: true,
  projectTitle: true,
  projectOneLiner: true,
  user: {
    select: {
      email: true,
      username: true,
      location: true,
      kycName: true,
      kycAddress: true,
      kycDOB: true,
      kycIDNumber: true,
      kycIDType: true,
      kycCountry: true,
    },
  },
  grant: { select: { approverRecordId: true, title: true } },
} as const;

export interface OnboardingApplication {
  readonly id: string;
  readonly approvedAmount: number;
  readonly projectTimeline: string;
  readonly createdAt: Date;
  readonly user: { readonly email: string; readonly kycName: string | null };
  readonly grant: { readonly airtableId: string | null };
}

export interface PaymentTranche {
  readonly id: string;
  readonly status: string;
  readonly approvedAmount: number | null;
}

// Earn's Airtable writes for grants. The foundation pays grantees from these
// records, so each mirrors Earn's fields exactly. A failure never undoes the
// database write that asked for it: it's logged, as Earn does.
export class GrantAirtable extends Context.Service<
  GrantAirtable,
  {
    // An application, upserted with its region (on apply and edit).
    readonly syncApplication: (
      application: AirtableApplication,
    ) => Effect.Effect<void>;
    // Decisions, upserted without regions (Earn's status sync).
    readonly syncStatuses: (
      applications: ReadonlyArray<AirtableApplication>,
    ) => Effect.Effect<void>;
    // The grantee, once KYC'd, as a recipient of the grant. Whether it was
    // filed: Earn files the payment only after it.
    readonly addRecipient: (
      application: OnboardingApplication,
    ) => Effect.Effect<boolean>;
    // An approved tranche to pay; skipped if it's already there.
    readonly addPayment: (
      application: PaymentApplication,
      tranche: PaymentTranche,
    ) => Effect.Effect<void>;
  }
>()('earn/GrantAirtable') {}

class AirtableFailed extends Schema.TaggedError<AirtableFailed>()(
  'AirtableFailed',
  { operation: Schema.String, cause: Schema.Defect() },
) {
  override get message() {
    return `Airtable request failed: ${this.operation}`;
  }
}

const Records = Schema.Struct({
  records: Schema.Array(Schema.Struct({ id: Schema.String })),
});

const turndown = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '-',
});
const markdown = (html: string | null) => turndown.turndown(html ?? '');

// A deadline Airtable can read, or ten days after applying (Earn's fallback
// for the free text it once took).
export function deadlineOf(timeline: string, createdAt: Date): string {
  if (!Number.isNaN(new Date(timeline).getTime())) return timeline;
  const fallback = new Date(createdAt);
  fallback.setDate(fallback.getDate() + 10);
  return `${fallback.getDate()} ${fallback.toLocaleString('en-US', { month: 'long' })} ${fallback.getFullYear()}`;
}

const STATUS: Record<string, string> = {
  Pending: 'Undecided',
  Approved: 'Accepted',
  Rejected: 'Rejected',
};

// Earn's convertGrantApplicationToAirtable.
export function applicationFields(
  application: AirtableApplication,
  region: string | null,
) {
  return {
    earnApplicationId: application.id,
    Title: application.projectTitle,
    Status:
      STATUS[application.applicationStatus] ?? application.applicationStatus,
    Summary: application.projectOneLiner,
    Funding: application.approvedAmount || application.ask,
    KPI: markdown(application.kpi),
    'Proof of Work': markdown(application.proofOfWork),
    Name: `${application.user.firstName} ${application.user.lastName}`,
    'Contact Email': application.user.email,
    'Twitter URL': application.twitter ?? undefined,
    'SOL Wallet': application.walletAddress,
    Milestones: markdown(application.milestones),
    Grants: [application.grant.airtableId],
    Description: markdown(application.projectDetails),
    'Discord Handle': application.user.discord ?? undefined,
    Deadline: deadlineOf(application.projectTimeline, application.createdAt),
    Type: 'Earn',
    'Grant Listing Title (Earn)': application.grant.title,
    ...(region ? { 'Region (Dashboard)': [region] } : {}),
  };
}

// Formulas take quoted values; a quote in one would end it early.
const quoted = (value: string) =>
  `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

const same = (a: string | null | undefined, b: string) =>
  (a ?? '').trim().toLowerCase() === b;

const tableUrl = (base: string, table: string) =>
  `https://api.airtable.com/v0/${base}/${encodeURIComponent(table)}`;

const SOLANA_ADDRESS = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const failed = (operation: string, cause: string) =>
  Effect.fail(new AirtableFailed({ operation, cause }));

// Logged, never failed: the write that called it has happened.
const softly = (
  operation: string,
  effect: Effect.Effect<unknown, AirtableFailed | Database.DatabaseError>,
) =>
  effect.pipe(
    Effect.asVoid,
    Effect.catch((error) =>
      Effect.logError('Airtable sync failed').pipe(
        Effect.annotateLogs({ operation, reason: error.message }),
      ),
    ),
  );

const make = Effect.gen(function* () {
  const config = yield* AppConfig.AppConfig;
  const database = yield* Database.Database;
  const airtable = config.airtable;

  // Superteam's chapters, to place an applicant in a region as Earn does.
  const [chapters] = yield* Effect.cachedInvalidateWithTTL(
    database.query('airtableChapters', (client) =>
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

  // Earn's getRegionNameForLocation: the chapter the location falls in.
  const regionNameOf = (location: string | null | undefined) =>
    Effect.gen(function* () {
      const wanted = (location ?? '').trim().toLowerCase();
      if (!wanted) return 'Global';
      const all = yield* chapters;
      const found = all.find(
        (chapter) =>
          same(chapter.region, wanted) ||
          same(chapter.displayValue || chapter.region, wanted) ||
          same(chapter.name, wanted) ||
          (Array.isArray(chapter.countries) &&
            chapter.countries.some(
              (country) => typeof country === 'string' && same(country, wanted),
            )),
      );
      return found?.region ?? 'Global';
    });

  const request = (
    operation: string,
    url: string,
    init: { method: string; body?: unknown } = { method: 'GET' },
  ) =>
    airtable
      ? Effect.tryPromise({
          try: async () => {
            const response = await fetch(url, {
              method: init.method,
              headers: {
                Authorization: `Bearer ${Redacted.value(airtable.token)}`,
                'Content-Type': 'application/json',
              },
              body:
                init.body === undefined ? undefined : JSON.stringify(init.body),
              signal: AbortSignal.timeout(15_000),
            });
            if (!response.ok) {
              throw new Error(`Airtable answered ${response.status}`);
            }
            const body: unknown = await response.json();
            return body;
          },
          catch: (cause) => new AirtableFailed({ operation, cause }),
        })
      : Effect.fail(
          new AirtableFailed({ operation, cause: 'Airtable not configured' }),
        );

  const findRecord = (operation: string, url: string, formula: string) =>
    request(
      operation,
      `${url}?${new URLSearchParams({ filterByFormula: formula, maxRecords: '1' })}`,
    ).pipe(
      Effect.map((body) =>
        Schema.decodeUnknownOption(Records)(body).pipe(
          Option.flatMap((data) => Option.fromNullishOr(data.records[0]?.id)),
          Option.getOrNull,
        ),
      ),
    );

  const grantsTable = () => {
    const base = airtable?.grantsBase;
    const table = airtable?.grantsTable;
    return base && table ? { base, table } : null;
  };

  const syncApplication = (application: AirtableApplication) =>
    softly(
      'syncApplication',
      Effect.gen(function* () {
        const grants = grantsTable();
        if (!airtable || !grants || !airtable.grantsRegionsTable) {
          return yield* failed('check', 'grants tables not configured');
        }
        const regionName = yield* regionNameOf(application.user.location);
        const region = yield* findRecord(
          'grantRegion',
          tableUrl(grants.base, airtable.grantsRegionsTable),
          `{Name} = ${quoted(regionName)}`,
        );
        return yield* request(
          'upsertApplication',
          tableUrl(grants.base, grants.table),
          {
            method: 'PATCH',
            body: {
              performUpsert: { fieldsToMergeOn: ['earnApplicationId'] },
              records: [{ fields: applicationFields(application, region) }],
            },
          },
        );
      }),
    );

  const syncStatuses = (applications: ReadonlyArray<AirtableApplication>) =>
    softly(
      'syncStatuses',
      Effect.gen(function* () {
        const grants = grantsTable();
        if (!grants) {
          return yield* failed('check', 'grants tables not configured');
        }
        // Airtable takes ten records a request (Earn sends at most ten).
        for (let start = 0; start < applications.length; start += 10) {
          yield* request(
            'upsertStatuses',
            tableUrl(grants.base, grants.table),
            {
              method: 'PATCH',
              body: {
                performUpsert: { fieldsToMergeOn: ['earnApplicationId'] },
                records: applications
                  .slice(start, start + 10)
                  .map((application) => ({
                    fields: applicationFields(application, null),
                  })),
              },
            },
          );
        }
        return undefined;
      }),
    );

  const addRecipient = (application: OnboardingApplication) =>
    Effect.gen(function* () {
      const grants = grantsTable();
      if (!airtable?.recipientsTable || !grants) {
        return yield* failed('check', 'recipients table not configured');
      }
      const applicant = yield* findRecord(
        'recipientApplicant',
        tableUrl(grants.base, grants.table),
        `{earnApplicationId} = ${quoted(application.id)}`,
      );
      if (!applicant) {
        return yield* failed('check', 'applicant not in Airtable');
      }
      if (!application.grant.airtableId) {
        return yield* failed('check', 'grant has no Airtable id');
      }
      return yield* request(
        'addRecipient',
        tableUrl(grants.base, airtable.recipientsTable),
        {
          method: 'POST',
          body: {
            records: [
              {
                fields: {
                  Name: `${application.user.kycName}`,
                  Applicants: [applicant],
                  Grant: [application.grant.airtableId],
                  'Email ID': application.user.email,
                  Amount: application.approvedAmount,
                  Deadline: deadlineOf(
                    application.projectTimeline,
                    application.createdAt,
                  ),
                },
              },
            ],
          },
        },
      );
    }).pipe(
      Effect.as(true),
      Effect.catch((error) =>
        Effect.logError('Airtable sync failed').pipe(
          Effect.annotateLogs({
            operation: 'addRecipient',
            reason: error.message,
          }),
          Effect.as(false),
        ),
      ),
    );

  const addPayment = (
    application: PaymentApplication,
    tranche: PaymentTranche,
  ) =>
    softly(
      'addPayment',
      Effect.gen(function* () {
        // Earn's input checks before a payment is filed.
        const { user, grant } = application;
        const country =
          user.kycCountry?.length === 3 ? lookup.byIso(user.kycCountry) : null;
        if (
          !SOLANA_ADDRESS.test(application.walletAddress) ||
          !EMAIL.test(user.email) ||
          user.username === null ||
          !user.kycName ||
          !user.kycDOB ||
          !user.kycIDNumber ||
          !user.kycIDType ||
          !country ||
          !grant.approverRecordId ||
          !grant.title ||
          !tranche.approvedAmount ||
          tranche.approvedAmount <= 0 ||
          tranche.status !== 'Approved'
        ) {
          return yield* failed('check', 'payment details incomplete');
        }
        const base = airtable?.paymentsBase;
        const table = airtable?.paymentsTable;
        const regions = airtable?.paymentsRegionsTable;
        if (!airtable || !base || !table || !regions) {
          return yield* failed('check', 'payments tables not configured');
        }
        const paymentsUrl = tableUrl(base, table);
        const existing = yield* findRecord(
          'existingPayment',
          paymentsUrl,
          `AND({earnApplicationId}=${quoted(application.id)}, {earnTrancheId}=${quoted(tranche.id)})`,
        );
        if (existing) return undefined;
        const chapterRegion = yield* regionNameOf(user.location);
        const regionName =
          chapterRegion.trim().toLowerCase() === 'united arab emirates'
            ? 'UAE'
            : chapterRegion;
        const region = yield* findRecord(
          'paymentRegion',
          tableUrl(base, regions),
          `{Country} = ${quoted(regionName)}`,
        );
        if (!region) {
          return yield* failed('check', 'payment region not found');
        }
        const purpose = `${grant.title} - ${user.username} - ${application.projectTitle} - ${application.projectOneLiner}`;
        return yield* request('addPayment', paymentsUrl, {
          method: 'POST',
          body: {
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
                  Amount: tranche.approvedAmount,
                  'Wallet Address': application.walletAddress,
                  Category: [
                    config.earnProduction
                      ? 'rec5KcbpJVSeLQX76'
                      : 'recd0Kn3N4Ffhtwhd',
                  ],
                  'Purpose of Payment': purpose || 'Grant Payment',
                  'Project (Archive)': application.projectTitle ?? '',
                  Email: user.email,
                  Status: 'Verified',
                  Region: [region],
                  Approver: [grant.approverRecordId],
                  earnApplicationId: application.id,
                  earnTrancheId: tranche.id,
                  'Discord / Earn Username': user.username,
                },
              },
            ],
          },
        });
      }),
    );

  return GrantAirtable.of({
    syncApplication,
    syncStatuses,
    addRecipient,
    addPayment,
  });
});

export const layer = Layer.effect(GrantAirtable, make);
