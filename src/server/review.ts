import 'server-only';

import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Schema from 'effect/Schema';

import type { Prisma } from '@/prisma/client';
import { SubmissionLabels, SubmissionStatus } from '@/prisma/enums';
import * as Credits from '@/server/credits';
import * as Database from '@/server/database';
import * as Queues from '@/server/queues';
import type * as Users from '@/server/users';

import {
  BONUS_POSITION,
  type ReviewListing,
  type ReviewPayment,
  type ReviewSubmission,
  rewardsOf,
  sortKey,
} from '@/features/sponsor-dashboard/utils/review-rules';

// A request Earn refuses with a 400, in Earn's words.
export class ReviewInvalid extends Schema.TaggedError<ReviewInvalid>()(
  'ReviewInvalid',
  { reason: Schema.String },
) {
  override get message() {
    return this.reason;
  }
}

export class ListingNotFound extends Schema.TaggedError<ListingNotFound>()(
  'ListingNotFound',
  { listingId: Schema.String },
) {
  override get message() {
    return `Listing with id=${this.listingId} not found.`;
  }
}

// The listing belongs to another sponsor. `sponsorId` is that sponsor when
// the account may switch to it (a member, or GOD).
export class NotYourListing extends Schema.TaggedError<NotYourListing>()(
  'NotYourListing',
  { sponsorId: Schema.optional(Schema.String) },
) {
  override get message() {
    return 'User is not authorized to perform this action.';
  }
}

export class SubmissionsNotFound extends Schema.TaggedError<SubmissionsNotFound>()(
  'SubmissionsNotFound',
  { ids: Schema.Array(Schema.String) },
) {
  override get message() {
    return `Submissions not found: ${this.ids.join(', ')}`;
  }
}

// The listing a sponsor acts on, as Earn's checkListingSponsorAuth finds it:
// it must exist and be the sponsor's own.
export const ownedListing = (
  database: Database.Database['Service'],
  sponsorId: string,
  listingId: string,
) =>
  Effect.gen(function* () {
    const listing = yield* database.query('ownedListing', (client) =>
      client.bounties.findUnique({ where: { id: listingId } }),
    );
    if (!listing) return yield* new ListingNotFound({ listingId });
    if (listing.sponsorId !== sponsorId) {
      return yield* new NotYourListing({ sponsorId: listing.sponsorId });
    }
    return listing;
  });

// Payment records as Earn stores them (JSON).
export function paymentsOf(value: unknown): Array<ReviewPayment> {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item: unknown) => {
    if (!item || typeof item !== 'object') return [];
    const txId: unknown = Reflect.get(item, 'txId');
    const amount: unknown = Reflect.get(item, 'amount');
    const tranche: unknown = Reflect.get(item, 'tranche');
    return typeof amount === 'number'
      ? [
          {
            txId: typeof txId === 'string' ? txId : '',
            amount,
            tranche: typeof tranche === 'number' ? tranche : 1,
          },
        ]
      : [];
  });
}

function answersOf(value: unknown): ReviewSubmission['eligibilityAnswers'] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item: unknown) => {
    if (!item || typeof item !== 'object') return [];
    const question: unknown = Reflect.get(item, 'question');
    const answer: unknown = Reflect.get(item, 'answer');
    return typeof question === 'string'
      ? [{ question, answer: typeof answer === 'string' ? answer : '' }]
      : [];
  });
}

const iso = (date: Date | null) => (date ? date.toISOString() : null);

// Earn's sponsor-dashboard submissions query.
const SUBMISSIONS_INCLUDE = {
  user: {
    select: {
      id: true,
      photo: true,
      firstName: true,
      lastName: true,
      username: true,
      email: true,
      walletAddress: true,
      twitter: true,
      discord: true,
      telegram: true,
      website: true,
      peopleId: true,
      people: {
        select: {
          id: true,
          chapterId: true,
          chapter: { select: { id: true, name: true, icons: true } },
        },
      },
      Submission: {
        select: {
          isWinner: true,
          rewardInUSD: true,
          listing: { select: { isWinnersAnnounced: true } },
        },
      },
      GrantApplication: {
        select: { approvedAmountInUSD: true, applicationStatus: true },
      },
    },
  },
  listing: true,
} as const satisfies Prisma.SubmissionInclude;

type SubmissionRow = Prisma.SubmissionGetPayload<{
  include: typeof SUBMISSIONS_INCLUDE;
}>;

export type ListingSubmission = SubmissionRow & {
  readonly totalEarnings: number;
};

const LISTING_INCLUDE = {
  sponsor: {
    select: {
      name: true,
      logo: true,
      isVerified: true,
      chapter: { select: { id: true } },
    },
  },
  poc: { select: { id: true, firstName: true, lastName: true, email: true } },
  Hackathon: {
    select: {
      altLogo: true,
      startDate: true,
      name: true,
      description: true,
      slug: true,
      announceDate: true,
      deadline: true,
      id: true,
      eligibility: true,
    },
  },
} as const satisfies Prisma.BountiesInclude;

export type DashboardListing = Prisma.BountiesGetPayload<{
  include: typeof LISTING_INCLUDE;
}> & { readonly totalPaymentsMade: number };

const toListingView = (listing: DashboardListing): ReviewListing => ({
  id: listing.id,
  slug: listing.slug,
  title: listing.title,
  type: listing.type,
  status: listing.status,
  isPublished: listing.isPublished,
  isWinnersAnnounced: listing.isWinnersAnnounced,
  isFndnPaying: listing.isFndnPaying,
  deadline: iso(listing.deadline),
  publishedAt: iso(listing.publishedAt),
  rewards: rewardsOf(listing.rewards),
  maxBonusSpots: listing.maxBonusSpots,
  token: listing.token,
  totalPaymentsMade: listing.totalPaymentsMade,
  hackathonAnnounceDate: iso(listing.Hackathon?.announceDate ?? null),
});

const toSubmissionView = (row: SubmissionRow): ReviewSubmission => ({
  id: row.id,
  status: row.status,
  label: row.label,
  link: row.link,
  tweet: row.tweet,
  otherInfo: row.otherInfo,
  eligibilityAnswers: answersOf(row.eligibilityAnswers),
  isWinner: row.isWinner,
  winnerPosition: row.winnerPosition,
  isPaid: row.isPaid,
  paymentDetails: paymentsOf(row.paymentDetails),
  notes: row.notes,
  createdAt: row.createdAt.toISOString(),
  user: {
    id: row.user.id,
    firstName: row.user.firstName,
    lastName: row.user.lastName,
    username: row.user.username,
    email: row.user.email,
    photo: row.user.photo,
    walletAddress: row.user.walletAddress,
    twitter: row.user.twitter,
    discord: row.user.discord,
    telegram: row.user.telegram,
    website: row.user.website,
  },
});

// What the review page shows, or why it can't.
export type ReviewPage =
  | {
      readonly _tag: 'Ready';
      readonly listing: ReviewListing;
      readonly submissions: ReadonlyArray<ReviewSubmission>;
    }
  // Another sponsor's listing they may switch to (Earn switched for them).
  | { readonly _tag: 'Switch'; readonly sponsorId: string }
  | { readonly _tag: 'Refused' };

export interface WinnerUpdate {
  readonly id: string;
  readonly isWinner?: boolean | undefined;
  readonly winnerPosition?: number | null | undefined;
}

// Reviewing a listing's submissions, for the sponsor that owns it: Earn's
// sponsor-dashboard listing, submissions and submission routes.
export class Review extends Context.Service<
  Review,
  {
    readonly page: (
      privyDid: string,
      slug: string,
      hackathon: boolean,
    ) => Effect.Effect<ReviewPage, Database.DatabaseError>;
    readonly listing: (
      writer: Users.SponsorWriter,
      slug: string,
    ) => Effect.Effect<
      DashboardListing,
      NotYourListing | Database.DatabaseError
    >;
    readonly submissions: (
      writer: Users.SponsorWriter,
      slug: string,
      hackathon: boolean,
    ) => Effect.Effect<Array<ListingSubmission>, Database.DatabaseError>;
    readonly updateLabel: (
      writer: Users.SponsorWriter,
      ids: ReadonlyArray<string>,
      label: SubmissionLabels,
    ) => Effect.Effect<
      unknown,
      | ReviewInvalid
      | SubmissionsNotFound
      | ListingNotFound
      | NotYourListing
      | Database.DatabaseError
    >;
    readonly updateNotes: (
      writer: Users.SponsorWriter,
      id: string,
      notes: string,
    ) => Effect.Effect<
      unknown,
      | SubmissionsNotFound
      | ListingNotFound
      | NotYourListing
      | Database.DatabaseError
    >;
    readonly reject: (
      writer: Users.SponsorWriter,
      ids: ReadonlyArray<string>,
    ) => Effect.Effect<
      { readonly count: number },
      | ReviewInvalid
      | SubmissionsNotFound
      | ListingNotFound
      | NotYourListing
      | Database.DatabaseError
    >;
    readonly toggleWinners: (
      writer: Users.SponsorWriter,
      updates: ReadonlyArray<WinnerUpdate>,
    ) => Effect.Effect<
      {
        readonly message: 'Success';
        readonly autoFixed: boolean;
        readonly autoFixedSubmissions: ReadonlyArray<string>;
      },
      | ReviewInvalid
      | SubmissionsNotFound
      | ListingNotFound
      | NotYourListing
      | Database.DatabaseError
    >;
    readonly totalPaymentsMade: (
      writer: Users.SponsorWriter,
      listingId: string,
    ) => Effect.Effect<
      number,
      ListingNotFound | NotYourListing | Database.DatabaseError
    >;
  }
>()('earn/Review') {}

const scopeOf = (
  sponsorId: string,
  hackathonId: string | null,
  hackathon: boolean,
): Prisma.BountiesWhereInput =>
  hackathon && hackathonId
    ? { OR: [{ sponsorId }, { hackathonId }] }
    : { sponsorId };

const mayManage = (
  user: {
    readonly role: string;
    readonly UserSponsors: ReadonlyArray<{ readonly sponsorId: string }>;
  },
  sponsorId: string,
) =>
  user.role === 'GOD' ||
  user.UserSponsors.some((membership) => membership.sponsorId === sponsorId);

// Earn's limits on one request.
const MAX_REJECT = 50;
const MAX_TOGGLE = 50;

const make = Effect.gen(function* () {
  const database = yield* Database.Database;
  const credits = yield* Credits.Credits;
  const queues = yield* Queues.Queues;

  const loadListing = (slug: string) =>
    database.query('reviewListing', (client) =>
      client.bounties.findFirst({
        where: { slug, isActive: true },
        include: LISTING_INCLUDE,
      }),
    );

  const paymentsMade = (listingId: string) =>
    database.query('totalPaymentsMade', (client) =>
      client.submission.count({ where: { listingId, isPaid: true } }),
    );

  const loadSubmissions = (slug: string, scope: Prisma.BountiesWhereInput) =>
    database
      .query('reviewSubmissions', (client) =>
        client.submission.findMany({
          where: {
            listing: { slug, isActive: true, ...scope },
            isActive: true,
            isArchived: false,
          },
          include: SUBMISSIONS_INCLUDE,
          orderBy: { createdAt: 'asc' },
        }),
      )
      .pipe(
        Effect.map((rows) =>
          rows
            .map((row) => ({ row, key: sortKey(row) }))
            // Stable, so equal keys keep the order they came in.
            .toSorted((a, b) => a.key - b.key)
            .map(({ row }) => row),
        ),
      );

  const account = (privyDid: string) =>
    database.query('reviewAccount', (client) =>
      client.user.findUnique({
        where: { privyDid },
        select: {
          id: true,
          isBlocked: true,
          role: true,
          currentSponsorId: true,
          hackathonId: true,
          UserSponsors: { select: { sponsorId: true } },
        },
      }),
    );

  const page = Effect.fn('Review.page')(function* (
    privyDid: string,
    slug: string,
    hackathon: boolean,
  ) {
    const user = yield* account(privyDid);
    if (!user || user.isBlocked || !user.currentSponsorId) {
      return { _tag: 'Refused' } satisfies ReviewPage;
    }
    const listing = yield* loadListing(slug);
    if (listing?.sponsorId !== user.currentSponsorId) {
      return listing && mayManage(user, listing.sponsorId)
        ? ({
            _tag: 'Switch',
            sponsorId: listing.sponsorId,
          } satisfies ReviewPage)
        : ({ _tag: 'Refused' } satisfies ReviewPage);
    }
    const [totalPaymentsMade, rows] = yield* Effect.all(
      [
        paymentsMade(listing.id),
        loadSubmissions(
          slug,
          scopeOf(user.currentSponsorId, user.hackathonId, hackathon),
        ),
      ],
      { concurrency: 2 },
    );
    return {
      _tag: 'Ready',
      listing: toListingView({ ...listing, totalPaymentsMade }),
      submissions: rows.map(toSubmissionView),
    } satisfies ReviewPage;
  });

  const listing = Effect.fn('Review.listing')(function* (
    writer: Users.SponsorWriter,
    slug: string,
  ) {
    const found = yield* loadListing(slug);
    if (found?.sponsorId !== writer.sponsorId) {
      const user = yield* account(writer.privyDid);
      return yield* new NotYourListing({
        sponsorId:
          found && user && mayManage(user, found.sponsorId)
            ? found.sponsorId
            : undefined,
      });
    }
    const totalPaymentsMade = yield* paymentsMade(found.id);
    return { ...found, totalPaymentsMade };
  });

  const submissions = Effect.fn('Review.submissions')(function* (
    writer: Users.SponsorWriter,
    slug: string,
    hackathon: boolean,
  ) {
    const rows = yield* loadSubmissions(
      slug,
      scopeOf(writer.sponsorId, writer.hackathonId, hackathon),
    );
    return rows.map((row) => {
      const listingWinnings = row.user.Submission.filter(
        (entry) => entry.isWinner && entry.listing.isWinnersAnnounced,
      ).reduce((sum, entry) => sum + entry.rewardInUSD, 0);
      const grantWinnings = row.user.GrantApplication.filter(
        (application) =>
          application.applicationStatus === 'Approved' ||
          application.applicationStatus === 'Completed',
      ).reduce(
        (sum, application) => sum + (application.approvedAmountInUSD ?? 0),
        0,
      );
      return { ...row, totalEarnings: listingWinnings + grantWinnings };
    });
  });

  // Submissions by id, every one found, all of one listing the sponsor owns.
  const ownedSubmissions = (sponsorId: string, ids: ReadonlyArray<string>) =>
    Effect.gen(function* () {
      const rows = yield* database.query('reviewSubmissionsById', (client) =>
        client.submission.findMany({ where: { id: { in: [...ids] } } }),
      );
      if (rows.length !== ids.length) {
        const found = new Set(rows.map((row) => row.id));
        return yield* new SubmissionsNotFound({
          ids: ids.filter((id) => !found.has(id)),
        });
      }
      const listingId = rows[0]?.listingId;
      if (!listingId) return yield* new SubmissionsNotFound({ ids: [] });
      const owned = yield* ownedListing(database, sponsorId, listingId);
      if (rows.some((row) => row.listingId !== listingId)) {
        return yield* new ReviewInvalid({
          reason: 'All submissions must belong to the same listing',
        });
      }
      return { rows, listing: owned };
    });

  const updateLabel = Effect.fn('Review.updateLabel')(function* (
    writer: Users.SponsorWriter,
    ids: ReadonlyArray<string>,
    label: SubmissionLabels,
  ) {
    if (ids.length === 0) {
      return yield* new ReviewInvalid({
        reason: 'id/ids and label are required',
      });
    }
    if (
      ids.length > 1 &&
      label !== SubmissionLabels.Spam &&
      label !== SubmissionLabels.Shortlisted
    ) {
      return yield* new ReviewInvalid({
        reason:
          'Multiple submissions only allowed for Spam and Shortlisted labels',
      });
    }
    const { rows, listing: owned } = yield* ownedSubmissions(
      writer.sponsorId,
      ids,
    );
    if (owned.isWinnersAnnounced && rows.some((row) => row.isWinner)) {
      return yield* new ReviewInvalid({
        reason: 'Cannot change label of announced winners',
      });
    }
    const results = yield* database.query('updateLabels', (client) =>
      client.$transaction(async (tx) => {
        const updated = [];
        for (const row of rows) {
          // A spam winner stops being one.
          const unwin = label === SubmissionLabels.Spam && row.isWinner;
          const result = await tx.submission.update({
            where: { id: row.id },
            data: unwin
              ? { label, isWinner: false, winnerPosition: null }
              : { label },
          });
          updated.push({ ...result, autoFixed: unwin });
        }
        return updated;
      }),
    );
    if (label === SubmissionLabels.Spam) {
      yield* Effect.forEach(
        rows,
        (row) =>
          Effect.andThen(
            credits.spamPenalty(row.id),
            queues.email({
              type: 'spamCredit',
              id: row.id,
              userId: row.userId,
            }),
          ),
        { discard: true },
      );
    }
    if (results.length === 1) return results[0];
    return {
      results,
      summary: {
        updated: results.length,
        autoFixed: results.filter((result) => result.autoFixed).length,
      },
    };
  });

  const updateNotes = Effect.fn('Review.updateNotes')(function* (
    writer: Users.SponsorWriter,
    id: string,
    notes: string,
  ) {
    yield* ownedSubmissions(writer.sponsorId, [id]).pipe(
      Effect.catchTag('ReviewInvalid', () => Effect.die('one submission')),
    );
    return yield* database.query('updateNotes', (client) =>
      client.submission.update({ where: { id }, data: { notes } }),
    );
  });

  const reject = Effect.fn('Review.reject')(function* (
    writer: Users.SponsorWriter,
    ids: ReadonlyArray<string>,
  ) {
    if (ids.length === 0) {
      return yield* new ReviewInvalid({
        reason: 'Data asked to update is empty',
      });
    }
    if (ids.length > MAX_REJECT) {
      return yield* new ReviewInvalid({
        reason: 'Only max 50 records allowed in data',
      });
    }
    const { rows } = yield* ownedSubmissions(writer.sponsorId, ids);
    const result = yield* database.query('rejectSubmissions', (client) =>
      client.submission.updateMany({
        where: { id: { in: [...ids] } },
        data: { status: SubmissionStatus.Rejected },
      }),
    );
    yield* Effect.forEach(
      rows,
      (row) =>
        queues.email({
          type: 'submissionRejected',
          id: row.id,
          userId: row.userId,
        }),
      { discard: true },
    );
    return { count: result.count };
  });

  const toggleWinners = Effect.fn('Review.toggleWinners')(function* (
    writer: Users.SponsorWriter,
    updates: ReadonlyArray<WinnerUpdate>,
  ) {
    if (updates.length === 0) {
      return yield* new ReviewInvalid({
        reason: 'Submissions array cannot be empty.',
      });
    }
    if (updates.length > MAX_TOGGLE) {
      return yield* new ReviewInvalid({
        reason: `Cannot update more than ${MAX_TOGGLE} submissions at once.`,
      });
    }
    const ids = new Set<string>();
    for (const update of updates) {
      if (!update.id) {
        return yield* new ReviewInvalid({
          reason: 'Each submission update must include an id.',
        });
      }
      if (ids.has(update.id)) {
        return yield* new ReviewInvalid({
          reason: `Duplicate submission ID found: ${update.id}`,
        });
      }
      ids.add(update.id);
      if (
        (update.isWinner === undefined) !==
        (update.winnerPosition === undefined)
      ) {
        return yield* new ReviewInvalid({
          reason: `For submission ${update.id}, isWinner and winnerPosition must be provided together if either is present`,
        });
      }
    }
    const { rows, listing: owned } = yield* ownedSubmissions(writer.sponsorId, [
      ...ids,
    ]);
    if (owned.isWinnersAnnounced) {
      return yield* new ReviewInvalid({
        reason: 'Submissions cannot be toggled post winner announcement.',
      });
    }
    const others = yield* database.query('otherWinners', (client) =>
      client.submission.findMany({
        where: {
          listingId: owned.id,
          isWinner: true,
          winnerPosition: { not: null },
          id: { notIn: [...ids] },
        },
        select: { id: true, winnerPosition: true },
      }),
    );
    const taken = new Set(others.map((other) => other.winnerPosition));
    let bonusWinners = others.filter(
      (other) => other.winnerPosition === BONUS_POSITION,
    ).length;
    const incoming = new Set<number>();
    for (const update of updates) {
      const position = update.winnerPosition;
      if (!update.isWinner || position === undefined || position === null) {
        continue;
      }
      if (position === BONUS_POSITION) {
        bonusWinners += 1;
        continue;
      }
      if (taken.has(position)) {
        return yield* new ReviewInvalid({
          reason: `Winner position ${position} is already assigned to another submission not in this update batch.`,
        });
      }
      if (incoming.has(position)) {
        return yield* new ReviewInvalid({
          reason: `Winner position ${position} is assigned multiple times within this request.`,
        });
      }
      incoming.add(position);
    }
    if (bonusWinners > owned.maxBonusSpots) {
      return yield* new ReviewInvalid({
        reason: `Assigning these winners would exceed the maximum allowed bonus spots (${owned.maxBonusSpots}). Current count (including this batch): ${bonusWinners}`,
      });
    }
    const current = new Map(rows.map((row) => [row.id, row]));
    const autoFixedSubmissions = updates
      .filter(
        (update) =>
          update.isWinner &&
          current.get(update.id)?.label === SubmissionLabels.Spam,
      )
      .map((update) => update.id);
    yield* database.query('toggleWinners', (client) =>
      client.$transaction(async (tx) => {
        for (const update of updates) {
          // A winner can't be spam: it goes back to review.
          const unspam = autoFixedSubmissions.includes(update.id);
          await tx.submission.update({
            where: { id: update.id },
            data: {
              isWinner: update.isWinner,
              winnerPosition: update.isWinner
                ? (update.winnerPosition ?? null)
                : null,
              ...(unspam
                ? {
                    label: SubmissionLabels.Unreviewed,
                    status: SubmissionStatus.Pending,
                  }
                : {}),
            },
          });
        }
      }),
    );
    return {
      message: 'Success' as const,
      autoFixed: autoFixedSubmissions.length > 0,
      autoFixedSubmissions,
    };
  });

  const totalPaymentsMade = Effect.fn('Review.totalPaymentsMade')(function* (
    writer: Users.SponsorWriter,
    listingId: string,
  ) {
    yield* ownedListing(database, writer.sponsorId, listingId);
    return yield* paymentsMade(listingId);
  });

  return Review.of({
    page,
    listing,
    submissions,
    updateLabel,
    updateNotes,
    reject,
    toggleWinners,
    totalPaymentsMade,
  });
});

export const layer = Layer.effect(Review, make);
