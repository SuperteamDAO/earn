import 'server-only';

import * as Clock from 'effect/Clock';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Schema from 'effect/Schema';
import Papa from 'papaparse';

import type { PrismaUserWithoutKYC } from '@/interface/user';
import type { SubmissionLabels } from '@/prisma/enums';
import * as Credits from '@/server/credits';
import * as Database from '@/server/database';
import * as GrantAirtable from '@/server/grant-airtable';
import { toJson } from '@/server/grant-json';
import * as GrantPayments from '@/server/grant-payments';
import * as GrantSheets from '@/server/grant-sheets';
import * as GrantTranches from '@/server/grant-tranches';
import * as Locks from '@/server/locks';
import * as Queues from '@/server/queues';
import type { SponsorWriter } from '@/server/users';
import { dayjs } from '@/utils/dayjs';
import { plainTextFromHtmlTurndown } from '@/utils/plainTextFromHtml';

import { COINDCX_GRANT_ID } from '@/features/grants/utils/stGrant';
import {
  type GrantApplicationMutationResponse,
  grantApplicationMutationSelect,
  type GrantApplicationStatusMutationResponse,
} from '@/features/sponsor-dashboard/constants/grantApplicationMutation';
import {
  sponsorGrantDetailsSelect,
  type SponsorGrantDetailsResponse,
} from '@/features/sponsor-dashboard/constants/sponsorGrantDetails';
import type { GrantTrancheWithApplication } from '@/features/sponsor-dashboard/queries/tranches';
import type { GrantApplicationWithUser } from '@/features/sponsor-dashboard/types';
import { validateCustomEmailNote } from '@/features/sponsor-dashboard/utils/customEmailSanitizer';
import {
  getGrantApprovedEmailBody,
  getGrantRejectedEmailBody,
  getTrancheApprovedEmailBody,
  getTrancheRejectedEmailBody,
} from '@/features/sponsor-dashboard/utils/grantEmailCopy';

// Earn refused, with the status and body its route answered: the sponsor
// dashboard's UI reads those bodies, so they stay exactly Earn's.
export class ReviewRefused extends Schema.TaggedError<ReviewRefused>()(
  'ReviewRefused',
  { status: Schema.Finite, body: Schema.Unknown },
) {
  override get message() {
    return `Grant review refused (${this.status})`;
  }
}

const refused = (status: number, body: Record<string, unknown>) =>
  Effect.fail(new ReviewRefused({ status, body }));

export interface Decision {
  readonly data: ReadonlyArray<{
    readonly id: string;
    readonly approvedAmount?: number | null;
  }>;
  readonly applicationStatus: string;
  readonly customNote?: string;
  readonly skipCooldown?: boolean;
}

export interface TrancheDecision {
  readonly id: string;
  readonly status: 'Approved' | 'Rejected';
  readonly approvedAmount?: number;
  readonly customNote?: string;
}

export interface Payment {
  readonly id: string;
  readonly trancheAmount: unknown;
  readonly txId: string;
}

export interface ApprovedGrantee {
  readonly id: string;
  readonly [key: string]: unknown;
}

type Errors = ReviewRefused | Database.DatabaseError;

// The sponsor's side of a grant: its applications, tranches, payments and
// exports, as Earn's sponsor-dashboard grant routes run them. Every method
// takes the sponsor acting (src/lib/route-guard.ts) and checks the grant is
// theirs, as Earn's checkGrantSponsorAuth does.
export class GrantReview extends Context.Service<
  GrantReview,
  {
    readonly grant: (
      sponsor: SponsorWriter,
      slug: string,
    ) => Effect.Effect<SponsorGrantDetailsResponse, Errors>;
    readonly applications: (
      sponsor: SponsorWriter,
      slug: string,
    ) => Effect.Effect<ReadonlyArray<GrantApplicationWithUser>, Errors>;
    readonly tranches: (
      sponsor: SponsorWriter,
      slug: string,
    ) => Effect.Effect<ReadonlyArray<GrantTrancheWithApplication>, Errors>;
    readonly approvedGrantees: (
      sponsor: SponsorWriter,
      grantId: string,
      search: string,
    ) => Effect.Effect<ReadonlyArray<GrantApplicationWithUser>, Errors>;
    readonly decide: (
      sponsor: SponsorWriter,
      decision: Decision,
    ) => Effect.Effect<GrantApplicationStatusMutationResponse, Errors>;
    readonly label: (
      sponsor: SponsorWriter,
      input: {
        readonly ids: ReadonlyArray<string>;
        readonly label: string;
      },
    ) => Effect.Effect<unknown, Errors>;
    readonly notes: (
      sponsor: SponsorWriter,
      id: string,
      notes: string,
    ) => Effect.Effect<unknown, Errors>;
    readonly complete: (
      sponsor: SponsorWriter,
      id: string,
    ) => Effect.Effect<GrantApplicationMutationResponse, Errors>;
    readonly recordPayment: (
      sponsor: SponsorWriter,
      payment: Payment,
    ) => Effect.Effect<GrantApplicationMutationResponse, Errors>;
    readonly decideTranche: (
      sponsor: SponsorWriter,
      decision: TrancheDecision,
    ) => Effect.Effect<void, Errors>;
    // The grant's applications as Earn's CSV export has them.
    readonly exportCsv: (
      sponsor: SponsorWriter,
      grantId: string,
    ) => Effect.Effect<{ readonly name: string; readonly csv: string }, Errors>;
    // The same rows in a new Google Sheet; its address.
    readonly exportSheet: (
      sponsor: SponsorWriter,
      grantId: string,
    ) => Effect.Effect<string, Errors>;
    // Publishes, unpublishes, pauses or resumes a grant.
    readonly setFlags: (
      sponsor: SponsorWriter,
      id: string,
      flags: { readonly isPublished?: boolean; readonly isPaused?: boolean },
    ) => Effect.Effect<unknown, Errors>;
    // Deletes a draft (hides it).
    readonly deleteDraft: (
      sponsor: SponsorWriter,
      id: string,
    ) => Effect.Effect<void, Errors>;
  }
>()('earn/GrantReview') {}

const MAX_NOTES_LENGTH = 2000;

// Turns an unexpected failure into Earn's generic answer for the route.
const orElse =
  (status: number, body: Record<string, unknown>) =>
  <A, E extends { readonly _tag: string }, R>(effect: Effect.Effect<A, E, R>) =>
    effect.pipe(
      Effect.catch((error) =>
        error._tag === 'ReviewRefused'
          ? // oxlint-disable-next-line typescript/no-unsafe-type-assertion
            Effect.fail(error as unknown as ReviewRefused)
          : Effect.logError('Grant review failed').pipe(
              Effect.annotateLogs({ reason: error._tag }),
              Effect.andThen(refused(status, body)),
            ),
      ),
      Effect.catchDefect(() =>
        Effect.logError('Grant review failed').pipe(
          Effect.andThen(refused(status, body)),
        ),
      ),
    );

const APPLICANT_SELECT = {
  id: true,
  publicKey: true,
  walletAddress: true,
  email: true,
  username: true,
  photo: true,
  firstName: true,
  lastName: true,
  createdAt: true,
  updatedAt: true,
  isVerified: true,
  role: true,
  isTalentFilled: true,
  interests: true,
  bio: true,
  twitter: true,
  discord: true,
  github: true,
  linkedin: true,
  website: true,
  telegram: true,
  community: true,
  experience: true,
  peopleId: true,
  people: {
    select: {
      id: true,
      chapterId: true,
      type: true,
      chapter: { select: { id: true, name: true, icons: true } },
    },
  },
  location: true,
  cryptoExperience: true,
  workPrefernce: true,
  currentEmployer: true,
  notifications: true,
  private: true,
  skills: true,
  currentSponsorId: true,
  emailVerified: true,
  hackathonId: true,
  featureModalShown: true,
  stRecommended: true,
  acceptedTOS: true,
  isBlocked: true,
  privyDid: true,
  isKYCVerified: true,
} as const;

const socialLink = (user: {
  telegram: string | null;
  twitter: string | null;
  discord: string | null;
}) => user.telegram || user.twitter || user.discord || '';

const plain = (html: string | null | undefined) =>
  plainTextFromHtmlTurndown.turndown(html || '');

const make = Effect.gen(function* () {
  const database = yield* Database.Database;
  const airtable = yield* GrantAirtable.GrantAirtable;
  const payments = yield* GrantPayments.GrantPayments;
  const sheets = yield* GrantSheets.GrantSheets;
  const tranches = yield* GrantTranches.GrantTranches;
  const credits = yield* Credits.Credits;
  const queues = yield* Queues.Queues;
  const locks = yield* Locks.Locks;

  // Earn's checkGrantSponsorAuth.
  const ownGrant = Effect.fn('GrantReview.ownGrant')(function* (
    sponsor: SponsorWriter,
    grantId: string,
  ) {
    const grant = yield* database.query('grantById', (client) =>
      client.grants.findUnique({ where: { id: grantId } }),
    );
    if (!grant) {
      return yield* refused(404, {
        error: `Bounty with id=${grantId} not found.`,
      });
    }
    if (grant.sponsorId !== sponsor.sponsorId) {
      return yield* refused(403, {
        error: 'User is not authorized to perform this action.',
      });
    }
    return grant;
  });

  const grant = Effect.fn('GrantReview.grant')(function* (
    sponsor: SponsorWriter,
    slug: string,
  ) {
    const row = yield* database.query('sponsorGrant', (client) =>
      client.grants.findFirst({
        where: { slug },
        select: sponsorGrantDetailsSelect,
      }),
    );
    if (!row) {
      return yield* refused(404, {
        message: `Grant with slug=${slug} not found.`,
      });
    }
    if (row.sponsorId !== sponsor.sponsorId) {
      // They may switch to the grant's sponsor: tell them which.
      const member =
        sponsor.god ||
        !!(yield* database.query('sponsorMembership', (client) =>
          client.userSponsors.findFirst({
            where: { userId: sponsor.userId, sponsorId: row.sponsorId },
            select: { sponsorId: true },
          }),
        ));
      return yield* refused(403, {
        error: 'User is not authorized to perform this action.',
        ...(member ? { sponsorId: row.sponsorId } : {}),
      });
    }
    const [totalApplications, approved, grantTrancheCount] =
      yield* database.query('sponsorGrantCounts', (client) =>
        Promise.all([
          client.grantApplication.count({ where: { grantId: row.id } }),
          client.grantApplication.aggregate({
            where: {
              grantId: row.id,
              applicationStatus: { in: ['Approved', 'Completed'] },
            },
            _sum: { approvedAmountInUSD: true },
          }),
          client.grantTranche.count({ where: { grantId: row.id } }),
        ]),
      );
    return {
      id: row.id,
      title: row.title,
      slug: row.slug,
      token: row.token ?? undefined,
      maxReward: row.maxReward ?? undefined,
      historicalApplications: row.historicalApplications,
      sponsorId: row.sponsorId,
      isPublished: row.isPublished,
      isActive: row.isActive,
      isArchived: row.isArchived,
      isPaused: row.isPaused,
      // Earn's JSON columns, as its response typed them.
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion
      questions: row.questions as SponsorGrantDetailsResponse['questions'],
      region: row.region,
      status: row.status,
      references:
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion
        (row.references as unknown as SponsorGrantDetailsResponse['references']) ??
        [],
      airtableId: row.airtableId ?? undefined,
      isNative: row.isNative,
      emailSalutation: row.emailSalutation,
      isST: row.isST,
      sponsor: {
        id: row.sponsor.id,
        name: row.sponsor.name,
        slug: row.sponsor.slug,
        logo: row.sponsor.logo ?? '',
        entityName: row.sponsor.entityName ?? undefined,
        isVerified: row.sponsor.isVerified,
        chapter: row.sponsor.chapter,
      },
      approvedAmountTotal: approved._sum.approvedAmountInUSD ?? 0,
      totalApplications,
      grantTrancheCount,
    } satisfies SponsorGrantDetailsResponse;
  });

  const applications = Effect.fn('GrantReview.applications')(function* (
    sponsor: SponsorWriter,
    slug: string,
  ) {
    const row = yield* database.query('grantBySlug', (client) =>
      client.grants.findUnique({
        where: { slug },
        select: { id: true, isActive: true },
      }),
    );
    if (!row || !row.isActive) {
      return yield* refused(404, {
        message: `Grant with slug=${slug} not found or is inactive.`,
      });
    }
    yield* ownGrant(sponsor, row.id);
    // Earn's order: what's left to review first, by label; then approved,
    // completed and rejected; newest first within each.
    const ordered = yield* database.query(
      'orderedApplications',
      (client) =>
        client.$queryRaw<
          Array<{
            id: string;
            listingWinnings: unknown;
            grantWinnings: unknown;
          }>
        >`
        SELECT
            GrantApplication.id,
            (
                SELECT COALESCE(SUM(Sub.rewardInUSD), 0)
                FROM Submission Sub
                INNER JOIN Bounties Lis ON Sub.listingId = Lis.id
                WHERE Sub.userId = GrantApplication.userId
                  AND Sub.isWinner = TRUE
                  AND Lis.isWinnersAnnounced = TRUE
            ) AS listingWinnings,
            (
                SELECT COALESCE(SUM(GA_Sub.approvedAmountInUSD), 0)
                FROM GrantApplication GA_Sub
                WHERE GA_Sub.userId = GrantApplication.userId
                  AND GA_Sub.applicationStatus IN ('Approved', 'Completed')
            ) AS grantWinnings
        FROM GrantApplication
        INNER JOIN Grants ON GrantApplication.grantId = Grants.id
        LEFT JOIN User ON GrantApplication.userId = User.id
        WHERE GrantApplication.grantId = ${row.id} AND Grants.sponsorId = ${sponsor.sponsorId}
        ORDER BY
          CASE
            WHEN GrantApplication.applicationStatus = 'Pending' AND GrantApplication.label = 'Unreviewed' THEN 1
            WHEN GrantApplication.applicationStatus = 'Pending' AND GrantApplication.label = 'Pending' THEN 1
            WHEN GrantApplication.applicationStatus = 'Pending' AND GrantApplication.label = 'Shortlisted' THEN 2
            WHEN GrantApplication.applicationStatus = 'Pending' AND GrantApplication.label = 'High_Quality' THEN 2
            WHEN GrantApplication.applicationStatus = 'Pending' AND GrantApplication.label = 'Mid_Quality' THEN 3
            WHEN GrantApplication.applicationStatus = 'Pending' AND GrantApplication.label = 'Reviewed' THEN 3
            WHEN GrantApplication.applicationStatus = 'Pending' AND GrantApplication.label = 'Low_Quality' THEN 4
            WHEN GrantApplication.applicationStatus = 'Pending' AND GrantApplication.label = 'Spam' THEN 5
            WHEN GrantApplication.applicationStatus = 'Pending' THEN 10
            WHEN GrantApplication.applicationStatus = 'Approved' THEN 100
            WHEN GrantApplication.applicationStatus = 'Completed' THEN 110
            WHEN GrantApplication.applicationStatus = 'Rejected' THEN 120
            ELSE 999
          END ASC,
          GrantApplication.createdAt DESC
      `,
    );
    if (ordered.length === 0) return [];
    const order = new Map(ordered.map((entry, index) => [entry.id, index]));
    const earnings = new Map(
      ordered.map((entry) => [
        entry.id,
        Number(entry.listingWinnings || 0) + Number(entry.grantWinnings || 0),
      ]),
    );
    const rows = yield* database.query('applicationsById', (client) =>
      client.grantApplication.findMany({
        where: { id: { in: ordered.map((entry) => entry.id) } },
        include: { user: { select: APPLICANT_SELECT }, grant: true },
      }),
    );
    const list = rows
      .map((application) => ({
        ...application,
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion
        user: application.user as unknown as PrismaUserWithoutKYC,
        totalEarnings: earnings.get(application.id) ?? 0,
      }))
      .toSorted(
        (a, b) => (order.get(a.id) ?? 9999) - (order.get(b.id) ?? 9999),
      );
    // As the dashboard has always received them (JSON).
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    return toJson(list) as unknown as ReadonlyArray<GrantApplicationWithUser>;
  });

  const trancheList = Effect.fn('GrantReview.tranches')(function* (
    sponsor: SponsorWriter,
    slug: string,
  ) {
    const row = yield* database.query('grantBySlug', (client) =>
      client.grants.findUnique({ where: { slug }, select: { id: true } }),
    );
    if (!row) {
      return yield* refused(404, {
        message: `Grant with slug=${slug} not found.`,
      });
    }
    yield* ownGrant(sponsor, row.id);
    const rows = yield* database.query('grantTranches', (client) =>
      client.grantTranche.findMany({
        where: {
          GrantApplication: {
            grant: { slug, isActive: true, sponsorId: sponsor.sponsorId },
          },
        },
        include: {
          GrantApplication: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  photo: true,
                  walletAddress: true,
                  discord: true,
                  username: true,
                  twitter: true,
                  telegram: true,
                  website: true,
                  Submission: {
                    select: {
                      isWinner: true,
                      rewardInUSD: true,
                      listing: { select: { isWinnersAnnounced: true } },
                    },
                  },
                  GrantApplication: {
                    select: {
                      approvedAmountInUSD: true,
                      applicationStatus: true,
                    },
                  },
                },
              },
              grant: true,
            },
          },
        },
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      }),
    );
    const list = rows.map((tranche) => {
      const user = tranche.GrantApplication.user;
      const listingWinnings = user.Submission.filter(
        (submission) =>
          submission.isWinner && submission.listing.isWinnersAnnounced,
      ).reduce((sum, submission) => sum + (submission.rewardInUSD || 0), 0);
      const grantWinnings = user.GrantApplication.filter(
        (application) =>
          application.applicationStatus === 'Approved' ||
          application.applicationStatus === 'Completed',
      ).reduce(
        (sum, application) => sum + (application.approvedAmountInUSD || 0),
        0,
      );
      return { ...tranche, totalEarnings: listingWinnings + grantWinnings };
    });
    const json = toJson(list);
    // As the dashboard has always received them (JSON).
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    return json as unknown as ReadonlyArray<GrantTrancheWithApplication>;
  });

  const approvedGrantees = Effect.fn('GrantReview.approvedGrantees')(function* (
    sponsor: SponsorWriter,
    grantId: string,
    search: string,
  ) {
    if (!grantId) return yield* refused(400, { error: 'grantId is required' });
    yield* ownGrant(sponsor, grantId);
    const term = search.toLowerCase();
    const rows = yield* database.query('approvedGrantees', (client) =>
      client.grantApplication.findMany({
        where: {
          grantId,
          applicationStatus: { in: ['Approved', 'Completed'] },
          ...(term
            ? {
                OR: [
                  { projectTitle: { contains: term } },
                  { user: { firstName: { contains: term } } },
                  { user: { lastName: { contains: term } } },
                ],
              }
            : {}),
        },
        include: {
          user: {
            select: {
              photo: true,
              firstName: true,
              lastName: true,
              username: true,
            },
          },
          GrantTranche: {
            where: { status: 'Paid' },
            orderBy: { trancheNumber: 'asc' },
          },
        },
      }),
    );
    // Earn's response type for the payments tab.
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    return toJson(rows) as unknown as ReadonlyArray<GrantApplicationWithUser>;
  });

  const GENERIC_DECISION = {
    error: 'Internal Server Error',
    message: 'Error occurred while updating the grant application.',
  };

  // Earn's checkAndUpdateKYCStatus: an approved applicant already KYC'd gets
  // their first tranche right away.
  const firstTrancheIfKycd = (userId: string, applicationId: string) =>
    Effect.gen(function* () {
      const user = yield* database.query('applicantKyc', (client) =>
        client.user.findUniqueOrThrow({
          where: { id: userId },
          select: { isKYCVerified: true, kycVerifiedAt: true },
        }),
      );
      if (!user.isKYCVerified || !user.kycVerifiedAt) return;
      yield* locks
        .with(
          `locks:create-tranche:${applicationId}:first-tranche`,
          Effect.gen(function* () {
            const application = yield* database.query(
              'approvedApplication',
              (client) =>
                client.grantApplication.findUniqueOrThrow({
                  where: { id: applicationId },
                  select: {
                    applicationStatus: true,
                    walletAddress: true,
                    grant: {
                      select: { id: true, airtableId: true, isNative: true },
                    },
                  },
                }),
            );
            if (
              application.grant.id === COINDCX_GRANT_ID ||
              !application.grant.airtableId ||
              !application.grant.isNative ||
              application.applicationStatus !== 'Approved'
            ) {
              return;
            }
            yield* tranches.create({
              applicationId,
              walletAddress: application.walletAddress || undefined,
              isFirstTranche: true,
            });
          }),
        )
        .pipe(
          Effect.catchTag('LockBusy', () =>
            Effect.logWarning('First tranche already in progress').pipe(
              Effect.annotateLogs({ applicationId }),
            ),
          ),
        );
    });

  const decide = Effect.fn('GrantReview.decide')(function* (
    sponsor: SponsorWriter,
    { data, applicationStatus, customNote, skipCooldown }: Decision,
  ) {
    const ids = data.map((entry) => entry.id);
    const current = yield* database.query('decidingApplications', (client) =>
      client.grantApplication.findMany({
        where: { id: { in: ids } },
        include: { grant: true, user: { select: { firstName: true } } },
      }),
    );
    if (current.length !== data.length) {
      const message = `Some records were not found in the data - only found these - ${current.map((c) => c.id).join(',')}`;
      return yield* refused(404, { error: message });
    }
    const grantId = current[0]?.grant.id;
    if (!grantId || !current.every((row) => row.grant.id === grantId)) {
      return yield* refused(404, {
        error: 'All records should have same and valid grant ID',
      });
    }
    yield* ownGrant(sponsor, grantId);
    const approve = applicationStatus === 'Approved';
    if (approve && current.some((row) => row.grant.isPaused)) {
      return yield* refused(409, {
        error: 'Grant is paused',
        message: 'Applications cannot be approved while the grant is paused.',
      });
    }

    let note: string | undefined;
    if (customNote) {
      for (const [index, application] of current.entries()) {
        const approvedAmount = data[index]?.approvedAmount ?? undefined;
        const fullEmailHtml = approve
          ? getGrantApprovedEmailBody({
              granteeName: application.user?.firstName,
              grantTitle: application.grant.title,
              projectTitle: application.projectTitle,
              approvedAmount: approvedAmount ?? undefined,
              token: application.grant.token || 'USDC',
              salutation: application.grant.emailSalutation,
              reviewerNote: customNote,
            })
          : getGrantRejectedEmailBody({
              granteeName: application.user?.firstName,
              grantTitle: application.grant.title,
              projectTitle: application.projectTitle,
              salutation: application.grant.emailSalutation,
              reviewerNote: customNote,
            });
        const check = validateCustomEmailNote({
          noteHtml: customNote,
          fullEmailHtml,
        });
        if (!check.isValid) {
          return yield* refused(400, {
            error: 'Invalid custom note',
            details: check.error,
          });
        }
        note = check.sanitized;
      }
    }

    return yield* Effect.gen(function* () {
      const now = yield* Clock.currentTimeMillis;
      const updates = yield* Effect.forEach(current, (application, index) =>
        Effect.gen(function* () {
          let approved = {
            approvedAmount: 0,
            approvedAmountInUSD: 0,
            totalTranches: 2,
          };
          if (approve) {
            const raw = data[index]?.approvedAmount;
            const amount = raw ? Number.parseInt(String(raw), 10) : 0;
            const max = application.grant.maxReward;
            if (!max || amount > max) {
              return yield* Effect.die(new Error('Approved amount over max'));
            }
            const token = yield* payments.token(application.grant.token);
            if (!token) return yield* Effect.die(new Error('Unknown token'));
            const price = yield* payments.usdPrice(token.mintAddress);
            approved = {
              approvedAmount: amount,
              approvedAmountInUSD: price * amount,
              totalTranches: amount > 5000 ? 3 : 2,
            };
          }
          const label: SubmissionLabels =
            application.label === 'Unreviewed' ||
            application.label === 'Pending'
              ? 'Reviewed'
              : application.label;
          return {
            id: application.id,
            data: {
              applicationStatus: approve
                ? ('Approved' as const)
                : // Earn takes the status as sent.
                  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
                  (applicationStatus as 'Rejected'),
              decidedAt: new Date(now),
              decidedBy: sponsor.userId,
              isCooldownSkipped:
                applicationStatus === 'Rejected' && !!skipCooldown,
              ...approved,
              label,
            },
          };
        }),
      );
      const result = yield* database.query('decideApplications', (client) =>
        client.$transaction(
          updates.map((update) =>
            client.grantApplication.update({
              where: { id: update.id },
              data: update.data,
              select: {
                ...GrantAirtable.AIRTABLE_APPLICATION,
                userId: true,
                grant: {
                  select: { airtableId: true, isNative: true, title: true },
                },
              },
            }),
          ),
        ),
      );

      if (approve) {
        yield* Effect.forEach(
          result,
          (application) =>
            credits.grantWinBonus(application.userId, application.id),
          { discard: true },
        );
        yield* Effect.forEach(
          result,
          (application) =>
            firstTrancheIfKycd(application.userId, application.id),
          { discard: true },
        );
      }
      if (result[0]?.grant.isNative === true) {
        yield* Effect.forEach(
          result,
          (application) =>
            queues.email({
              type: approve ? 'grantApproved' : 'grantRejected',
              id: application.id,
              userId: application.userId,
              otherInfo: note ? { customEmailNote: note } : undefined,
            }),
          { discard: true },
        );
      }
      if (result[0]?.grant.airtableId) {
        yield* airtable.syncStatuses(result);
      }
      return {
        success: true as const,
        applicationIds: result.map((application) => application.id),
      };
    }).pipe(orElse(500, GENERIC_DECISION));
  });

  const label = Effect.fn('GrantReview.label')(function* (
    sponsor: SponsorWriter,
    { ids, label: value }: { ids: ReadonlyArray<string>; label: string },
  ) {
    if (!ids.length || !value) {
      return yield* refused(400, { error: 'id/ids and label are required' });
    }
    if (ids.length > 1 && !['Spam', 'Shortlisted'].includes(value)) {
      return yield* refused(400, {
        error:
          'Multiple applications only allowed for Spam and Shortlisted labels',
      });
    }
    const generic = {
      error: 'Internal Server Error',
      message: 'Error occurred while updating the applications.',
    };
    const current = yield* database
      .query('labelApplications', (client) =>
        client.grantApplication.findMany({ where: { id: { in: [...ids] } } }),
      )
      .pipe(orElse(500, generic));
    if (current.length !== ids.length) {
      const found = current.map((row) => row.id);
      const missing = ids.filter((id) => !found.includes(id));
      return yield* refused(404, {
        message: `Applications not found: ${missing.join(', ')}`,
      });
    }
    const first = current[0];
    if (!first)
      return yield* refused(404, { message: 'No applications found' });
    yield* ownGrant(sponsor, first.grantId);
    if (current.some((row) => row.grantId !== first.grantId)) {
      return yield* refused(400, {
        error: 'All applications must belong to the same grant',
      });
    }
    const results = yield* Effect.forEach(current, (application) =>
      Effect.gen(function* () {
        const updated = yield* database.query('labelApplication', (client) =>
          client.grantApplication.update({
            where: { id: application.id },
            // Earn passes the label as sent; Prisma refuses unknown ones.
            // oxlint-disable-next-line typescript/no-unsafe-type-assertion
            data: { label: value as SubmissionLabels },
          }),
        );
        if (value === 'Spam') {
          yield* credits.grantSpamPenalty(application.userId, application.id);
        }
        return updated;
      }),
    ).pipe(orElse(500, generic));
    return toJson(
      ids.length === 1
        ? results[0]
        : { results, summary: { updated: results.length } },
    );
  });

  const notes = Effect.fn('GrantReview.notes')(function* (
    sponsor: SponsorWriter,
    id: string,
    value: string,
  ) {
    if (plainTextFromHtmlTurndown.turndown(value).length > MAX_NOTES_LENGTH) {
      return yield* refused(400, {
        error: `notes must be a string of ${MAX_NOTES_LENGTH} characters or fewer`,
      });
    }
    const generic = {
      error: 'Internal Server Error',
      message: 'Error occurred while updating the application with notes.',
    };
    const current = yield* database
      .query('applicationForNotes', (client) =>
        client.grantApplication.findUnique({
          where: { id },
          select: { grantId: true },
        }),
      )
      .pipe(orElse(500, generic));
    if (!current) {
      return yield* refused(404, {
        message: `Application with ID ${id} not found.`,
      });
    }
    yield* ownGrant(sponsor, current.grantId);
    const updated = yield* database
      .query('saveNotes', (client) =>
        client.grantApplication.update({
          where: { id },
          data: { notes: value },
        }),
      )
      .pipe(orElse(500, generic));
    return toJson(updated);
  });

  const complete = Effect.fn('GrantReview.complete')(function* (
    sponsor: SponsorWriter,
    id: string,
  ) {
    const generic = {
      error: 'Internal Server Error',
      message: 'Error occurred while updating the grant application.',
    };
    const current = yield* database
      .query('applicationToComplete', (client) =>
        client.grantApplication.findUnique({
          where: { id },
          select: {
            grantId: true,
            userId: true,
            applicationStatus: true,
          },
        }),
      )
      .pipe(orElse(500, generic));
    if (!current) {
      return yield* refused(404, { error: 'Grant application not found' });
    }
    yield* ownGrant(sponsor, current.grantId);
    if (current.applicationStatus !== 'Approved') {
      return yield* refused(400, {
        error: 'Only approved grant applications can be completed',
      });
    }
    const result = yield* database
      .query('completeApplication', (client) =>
        client.grantApplication.update({
          where: { id },
          data: { applicationStatus: 'Completed' },
          select: grantApplicationMutationSelect,
        }),
      )
      .pipe(orElse(500, generic));
    yield* queues.email({
      type: 'grantCompleted',
      id: result.id,
      userId: current.userId,
    });
    return result;
  });

  const recordPayment = Effect.fn('GrantReview.recordPayment')(function* (
    sponsor: SponsorWriter,
    { id, trancheAmount, txId }: Payment,
  ) {
    if (!id || trancheAmount === undefined || trancheAmount === null || !txId) {
      return yield* refused(400, {
        error: 'Missing required body parameters: id, trancheAmount, or txId',
      });
    }
    const amount = Number(trancheAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return yield* refused(400, {
        error: 'trancheAmount must be a positive finite number',
      });
    }
    return yield* Effect.gen(function* () {
      const current = yield* database.query('applicationToPay', (client) =>
        client.grantApplication.findUnique({
          where: { id },
          select: {
            grantId: true,
            userId: true,
            approvedAmount: true,
            totalPaid: true,
            paymentDetails: true,
            totalTranches: true,
            walletAddress: true,
            grant: { select: { token: true } },
          },
        }),
      );
      if (!current) {
        return yield* refused(404, { error: 'Grant application not found' });
      }
      yield* ownGrant(sponsor, current.grantId);
      const remaining = current.approvedAmount - current.totalPaid;
      if (amount > remaining) {
        return yield* refused(400, {
          error: `Tranche amount exceeds remaining approved amount (${remaining})`,
        });
      }
      const normalized = GrantPayments.normalizeTxId(txId);
      if (yield* payments.used(normalized)) {
        return yield* refused(400, {
          error: `Transaction IDs already used: ${normalized}`,
        });
      }
      const token = yield* payments.token(current.grant.token);
      if (!token) {
        return yield* refused(400, {
          error: "Token doesn't exist for this grant",
        });
      }
      const price = yield* payments.usdPrice(token.mintAddress).pipe(
        Effect.map((value): number | undefined => value),
        Effect.orElseSucceed(() => undefined),
      );
      const check = yield* payments.verify({
        txId: normalized,
        recipient: current.walletAddress,
        amount,
        token,
        usdPrice: price,
      });
      if (!check.isValid) {
        return yield* refused(400, {
          error: check.error,
          message: `Transaction validation failed: ${check.error}`,
        });
      }
      const details = Array.isArray(current.paymentDetails)
        ? [...current.paymentDetails]
        : [];
      details.push({
        txId: txId || null,
        tranche: current.totalTranches + 1,
        amount,
      });
      const fullyPaid = current.totalPaid + amount >= current.approvedAmount;
      const result = yield* database.query('recordGrantPayment', (client) =>
        client.grantApplication.update({
          where: { id },
          data: {
            totalPaid: { increment: amount },
            totalTranches: { increment: 1 },
            paymentDetails: details,
            ...(fullyPaid && { applicationStatus: 'Completed' }),
          },
          select: grantApplicationMutationSelect,
        }),
      );
      yield* queues.email({
        type: 'grantPaymentReceived',
        id,
        userId: current.userId,
      });
      return result;
    }).pipe(
      orElse(400, {
        error: 'Internal Server Error',
        message: `Error occurred while updating payment of a submission ${id}.`,
      }),
    );
  });

  const decideTranche = Effect.fn('GrantReview.decideTranche')(function* (
    sponsor: SponsorWriter,
    { id, status, approvedAmount, customNote }: TrancheDecision,
  ) {
    yield* locks
      .with(
        `locks:update-tranche-status:${id}`,
        Effect.gen(function* () {
          const tranche = yield* database.query('trancheToDecide', (client) =>
            client.grantTranche.findUniqueOrThrow({
              where: { id },
              include: {
                Grant: { include: { sponsor: true } },
                GrantApplication: {
                  include: { user: { select: { firstName: true } } },
                },
              },
            }),
          );
          yield* ownGrant(sponsor, tranche.grantId);
          if (tranche.status !== 'Pending') {
            return yield* refused(409, {
              error: 'Tranche has already been decided',
              message: `Only pending tranches can be approved or rejected. This tranche is already ${tranche.status.toLowerCase()}.`,
            });
          }
          let note: string | undefined;
          if (customNote) {
            const common = {
              granteeName: tranche.GrantApplication.user?.firstName,
              projectTitle: tranche.GrantApplication.projectTitle,
              sponsorName: tranche.Grant.sponsor.name,
              salutation: tranche.Grant.emailSalutation,
              reviewerNote: customNote,
            };
            const fullEmailHtml =
              status === 'Approved'
                ? getTrancheApprovedEmailBody({
                    ...common,
                    approvedAmount,
                    token: tranche.Grant.token || 'USDC',
                  })
                : getTrancheRejectedEmailBody(common);
            const check = validateCustomEmailNote({
              noteHtml: customNote,
              fullEmailHtml,
            });
            if (!check.isValid) {
              return yield* refused(400, {
                error: 'Invalid custom note',
                details: check.error,
              });
            }
            note = check.sanitized;
          }
          const application = yield* database.query(
            'trancheApplication',
            (client) =>
              client.grantApplication.findUniqueOrThrow({
                where: { id: tranche.applicationId },
                select: {
                  totalTranches: true,
                  approvedAmount: true,
                  totalPaid: true,
                },
              }),
          );
          if (status === 'Approved') {
            if (approvedAmount === undefined) {
              return yield* refused(400, {
                error: 'Invalid approved amount',
                message: 'Approved amount is required for approved tranches.',
              });
            }
            if (approvedAmount > tranche.ask) {
              return yield* refused(400, {
                error: 'Invalid approved amount',
                message: `Approved amount (${approvedAmount}) cannot exceed tranche requested amount (${tranche.ask}).`,
              });
            }
            const [approvedTranches, existing] = yield* database.query(
              'trancheTotals',
              (client) =>
                Promise.all([
                  client.grantTranche.findMany({
                    where: {
                      applicationId: tranche.applicationId,
                      status: 'Approved',
                      id: { not: id },
                    },
                    select: { approvedAmount: true },
                  }),
                  client.grantTranche.count({
                    where: {
                      applicationId: tranche.applicationId,
                      status: { not: 'Rejected' },
                    },
                  }),
                ]),
            );
            const soFar = approvedTranches.reduce(
              (sum, row) => sum + (row.approvedAmount || 0),
              0,
            );
            if (soFar + approvedAmount > application.approvedAmount) {
              return yield* refused(400, {
                error: 'Invalid approved amount',
                message: `Total approved tranches (${soFar + approvedAmount}) would exceed grant's approved amount (${application.approvedAmount})`,
              });
            }
            let totalTranches = application.totalTranches;
            if (
              totalTranches - existing === 0 &&
              application.totalPaid + approvedAmount <
                application.approvedAmount
            ) {
              totalTranches += 1;
            }
            yield* database.query('trancheCount', (client) =>
              client.grantApplication.update({
                where: { id: tranche.applicationId },
                data: { totalTranches },
              }),
            );
          }
          const now = yield* Clock.currentTimeMillis;
          const result = yield* database.query('decideTranche', (client) =>
            client.grantTranche.update({
              where: { id },
              data: { status, decidedAt: new Date(now), approvedAmount },
              select: {
                id: true,
                status: true,
                approvedAmount: true,
                GrantApplication: {
                  select: {
                    ...GrantAirtable.PAYMENT_APPLICATION,
                    userId: true,
                  },
                },
              },
            }),
          );
          if (result.status === 'Approved') {
            yield* airtable.addPayment(result.GrantApplication, result);
          }
          yield* queues.email({
            type:
              result.status === 'Approved'
                ? 'trancheApproved'
                : 'trancheRejected',
            id: result.id,
            userId: result.GrantApplication.userId,
            otherInfo: note ? { customEmailNote: note } : undefined,
          });
          return yield* Effect.void;
        }),
      )
      .pipe(
        Effect.catchTag('LockBusy', () =>
          refused(409, {
            error: 'Tranche update already in progress',
            message: `Tranche update is already being processed for tranche with id=${id}.`,
          }),
        ),
        orElse(500, {
          error: 'Internal Server Error',
          message: 'Error occurred while updating the grant tranche.',
        }),
      );
  });

  // Earn's export rows, for CSV and Sheets alike.
  const exportRows = Effect.fn('GrantReview.exportRows')(function* (
    sponsor: SponsorWriter,
    grantId: string,
    sheet: boolean,
  ) {
    const owned = yield* ownGrant(sponsor, grantId);
    const rows = yield* database.query('exportApplications', (client) =>
      client.grantApplication.findMany({
        where: { grantId },
        include: { user: true },
        orderBy: [{ applicationStatus: 'asc' }, { createdAt: 'asc' }],
        take: 1000,
      }),
    );
    const questions = Array.isArray(owned.questions)
      ? owned.questions.flatMap((question: unknown) =>
          typeof question === 'object' &&
          question !== null &&
          'question' in question &&
          typeof question.question === 'string'
            ? [question.question]
            : [],
        )
      : [];
    const questionSet = [...new Set(questions)];
    const json = rows.map((application, index) => {
      const user = application.user;
      const answers = Array.isArray(application.answers)
        ? application.answers
        : [];
      const custom: Record<string, string> = {};
      for (const question of questionSet) {
        const found = answers.find(
          (answer: unknown) =>
            typeof answer === 'object' &&
            answer !== null &&
            'question' in answer &&
            answer.question === question,
        );
        custom[question] =
          typeof found === 'object' &&
          found !== null &&
          'answer' in found &&
          typeof found.answer === 'string'
            ? plain(found.answer)
            : '';
      }
      return {
        'Sr no': index + 1,
        Name: `${user.firstName} ${user.lastName}`,
        'Email ID': user.email,
        'Profile Link': `https://superteam.fun/earn/t/${user.username}`,
        'User Wallet': user.walletAddress,
        // The CSV carries the payout wallet too; the sheet never did.
        ...(sheet ? {} : { 'Recipient Wallet': application.walletAddress }),
        'User Social Link': socialLink(user),
        'Twitter Link': application.twitter || '',
        'Application Date': dayjs(application.createdAt).format('DD MMM YYYY'),
        'Project Title': application.projectTitle,
        'One Liner Description': application.projectOneLiner,
        'Project Details': plain(application.projectDetails),
        Deadline: application.projectTimeline,
        'Proof of work': plain(application.proofOfWork),
        'Goals and Milestones': plain(application.milestones),
        'Primary KPI': plain(application.kpi),
        ...custom,
        Ask: application.ask || '',
        'Approved Amount': application.approvedAmount,
        'Grant Decision': application.applicationStatus,
        Notes: plain(application.notes),
      };
    });
    return { grant: owned, rows: json };
  });

  const exportCsv = Effect.fn('GrantReview.exportCsv')(function* (
    sponsor: SponsorWriter,
    grantId: string,
  ) {
    const { grant: owned, rows } = yield* exportRows(sponsor, grantId, false);
    const now = yield* Clock.currentTimeMillis;
    return {
      name: `${owned.slug || grantId}-applications-${now}.csv`,
      csv: Papa.unparse(rows),
    };
  });

  const exportSheet = Effect.fn('GrantReview.exportSheet')(function* (
    sponsor: SponsorWriter,
    grantId: string,
  ) {
    if (!grantId) {
      return yield* refused(400, {
        error: 'Missing required parameter: grantId',
      });
    }
    const { grant: owned, rows } = yield* exportRows(sponsor, grantId, true);
    const now = yield* Clock.currentTimeMillis;
    return yield* sheets
      .create(
        `${owned.title || grantId} - Applications - ${dayjs(now).format('YYYY-MM-DD')}`,
        rows.map((row) =>
          Object.fromEntries(
            Object.entries(row).map(([key, value]) => [
              key,
              value === null || value === undefined ? '' : value,
            ]),
          ),
        ),
      )
      .pipe(
        orElse(400, {
          error: 'Internal Server Error',
          message: `Error occurred while exporting applications to Google Sheets for grant=${grantId}.`,
        }),
      );
  });

  const setFlags = Effect.fn('GrantReview.setFlags')(function* (
    sponsor: SponsorWriter,
    id: string,
    flags: { readonly isPublished?: boolean; readonly isPaused?: boolean },
  ) {
    yield* ownGrant(sponsor, id);
    const result = yield* database
      .query('grantFlags', (client) =>
        client.grants.update({
          where: { id },
          data: { isPublished: flags.isPublished, isPaused: flags.isPaused },
        }),
      )
      .pipe(
        orElse(400, {
          error: 'Internal Server Error',
          message: `Error occurred while updating grant with id=${id}.`,
        }),
      );
    return toJson(result);
  });

  const deleteDraft = Effect.fn('GrantReview.deleteDraft')(function* (
    sponsor: SponsorWriter,
    id: string,
  ) {
    const owned = yield* ownGrant(sponsor, id);
    if (owned.status !== 'OPEN' || owned.isPublished) {
      return yield* refused(400, {
        message: 'Only draft grants can be deleted',
      });
    }
    return yield* database
      .query('deleteDraftGrant', (client) =>
        client.grants.update({ where: { id }, data: { isActive: false } }),
      )
      .pipe(
        Effect.asVoid,
        orElse(400, {
          error: 'Internal Server Error',
          message: `Error occurred while deleting grant with id=${id}.`,
        }),
      );
  });

  return GrantReview.of({
    grant,
    applications,
    tranches: trancheList,
    approvedGrantees,
    decide,
    label,
    notes,
    complete,
    recordPayment,
    decideTranche,
    exportCsv,
    exportSheet,
    setFlags,
    deleteDraft,
  });
});

export const layer = Layer.effect(GrantReview, make);
