import 'server-only';

import * as Clock from 'effect/Clock';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Schema from 'effect/Schema';

import * as Credits from '@/server/credits';
import * as Database from '@/server/database';
import { chapterRegions } from '@/server/listing-regions';
import * as Queues from '@/server/queues';

import {
  sanitizeGrantApplicationAnswers,
  sanitizeGrantApplicationHtml,
} from '@/features/grants/utils/sanitizeGrantApplicationHtml';
import { getLocationCooldown } from '@/features/listings/utils/locationCooldown';
import { userRegionEligibilty } from '@/features/listings/utils/region';
import {
  type SubmissionFields,
  type SubmissionIssue,
  submissionIssues,
} from '@/features/listings/utils/submissionRules';

// Why Earn refuses a submission, in the order it checks.
export class SubmissionRefused extends Schema.TaggedError<SubmissionRefused>()(
  'SubmissionRefused',
  {
    reason: Schema.Literals([
      'user',
      'blocked',
      'listing',
      'unavailable',
      'unpublished',
      'profile',
      'region',
      'cooldown',
      'closed',
      'credits',
      'exists',
      'missing',
      'rejected',
    ]),
  },
) {
  override get message() {
    return `Submission refused: ${this.reason}`;
  }
}

export class InvalidSubmission extends Schema.TaggedError<InvalidSubmission>()(
  'InvalidSubmission',
  {
    issues: Schema.Array(
      Schema.Struct({
        path: Schema.Array(Schema.Union([Schema.String, Schema.Finite])),
        message: Schema.String,
      }),
    ),
  },
) {
  override get message() {
    return `Invalid submission: ${this.issues.map((issue) => issue.path.join('.')).join(', ')}`;
  }
}

export interface SubmissionInput extends SubmissionFields {
  readonly listingId: string;
}

type Failure = SubmissionRefused | InvalidSubmission | Database.DatabaseError;

export class ListingSubmissions extends Context.Service<
  ListingSubmissions,
  {
    // Earn's /api/submission/create: every check, then the submission and
    // its credit (none for hackathon tracks) in one transaction, the
    // talent's row locked first. Succeeds with the submission's id.
    readonly create: (
      userId: string,
      input: SubmissionInput,
    ) => Effect.Effect<string, Failure>;
    // Earn's /api/submission/update: the same checks (no location
    // cooldown), until the deadline, unless rejected or marked spam.
    readonly update: (
      userId: string,
      input: SubmissionInput,
    ) => Effect.Effect<string, Failure>;
  }
>()('earn/ListingSubmissions') {}

const refuse = (reason: SubmissionRefused['reason']) =>
  Effect.fail(new SubmissionRefused({ reason }));

const linkedHandles = (linkedTwitter: unknown): Array<string> =>
  Array.isArray(linkedTwitter)
    ? linkedTwitter.filter(
        (handle): handle is string => typeof handle === 'string',
      )
    : [];

// What Earn stores: sanitized HTML, empty strings for missing links.
const stored = (data: SubmissionFields) => ({
  link: data.link || '',
  tweet: data.tweet || '',
  otherInfo: sanitizeGrantApplicationHtml(data.otherInfo),
  eligibilityAnswers:
    sanitizeGrantApplicationAnswers(
      data.eligibilityAnswers?.map((answer) => ({ ...answer })),
    ) || [],
});

type Outcome =
  | { readonly refused: SubmissionRefused['reason'] }
  | { readonly issues: Array<SubmissionIssue> }
  | { readonly created: string };

// Earn's form rules, as the server checks them.
const checked = (
  listing: { readonly type: string; readonly eligibility: unknown },
  verifiedHandles: ReadonlyArray<string>,
  input: SubmissionFields,
) => {
  const issues = submissionIssues(listing, verifiedHandles, input);
  return issues.length > 0
    ? Effect.fail(new InvalidSubmission({ issues }))
    : Effect.void;
};

const make = Effect.gen(function* () {
  const database = yield* Database.Database;
  const credits = yield* Credits.Credits;
  const queues = yield* Queues.Queues;

  // Earn's validateSubmissionRequest.
  const validate = Effect.fn('ListingSubmissions.validate')(function* (
    userId: string,
    listingId: string,
    options: { readonly skipLocationCooldown: boolean },
  ) {
    const [user, listing, chapters] = yield* Effect.all(
      [
        database.query('submitter', (client) =>
          client.user.findUnique({
            where: { id: userId },
            select: {
              isBlocked: true,
              isTalentFilled: true,
              location: true,
              locationUpdatedAt: true,
              linkedTwitter: true,
            },
          }),
        ),
        database.query('submitListing', (client) =>
          client.bounties.findUnique({
            where: { id: listingId },
            select: {
              id: true,
              type: true,
              region: true,
              deadline: true,
              eligibility: true,
              isActive: true,
              isPublished: true,
            },
          }),
        ),
        chapterRegions(database),
      ],
      { concurrency: 'unbounded' },
    );
    if (!user) return yield* refuse('user');
    if (user.isBlocked) return yield* refuse('blocked');
    if (!listing) return yield* refuse('listing');
    if (!listing.isActive) return yield* refuse('unavailable');
    if (!listing.isPublished) return yield* refuse('unpublished');
    if (!user.isTalentFilled) return yield* refuse('profile');
    if (
      !userRegionEligibilty({
        region: listing.region,
        userLocation: user.location || '',
        chapters,
      })
    ) {
      return yield* refuse('region');
    }
    if (!options.skipLocationCooldown) {
      const cooldown = getLocationCooldown({
        locationUpdatedAt: user.locationUpdatedAt,
        listingRegion: listing.region,
        userLocation: user.location,
        chapters,
      });
      if (cooldown.inCooldown) return yield* refuse('cooldown');
    }
    const now = yield* Clock.currentTimeMillis;
    if (listing.deadline && now > listing.deadline.getTime()) {
      return yield* refuse('closed');
    }
    return { listing, verifiedHandles: linkedHandles(user.linkedTwitter) };
  });

  const create = Effect.fn('ListingSubmissions.create')(function* (
    userId: string,
    input: SubmissionInput,
  ) {
    const { listing } = yield* validate(userId, input.listingId, {
      skipLocationCooldown: false,
    });
    const isHackathon = listing.type === 'hackathon';
    // The credit is spent inside the transaction's callback, with this
    // effect's services.
    const context = yield* Effect.context();
    const month = Credits.monthStart(yield* Clock.currentTimeMillis);

    const outcome: Outcome = yield* database.query(
      'createSubmission',
      (client) =>
        client.$transaction(async (tx): Promise<Outcome> => {
          await tx.$queryRaw`
            SELECT id FROM \`User\`
            WHERE id = ${userId}
            FOR UPDATE
          `;
          if (!isHackathon) {
            const sum = await tx.creditLedger.aggregate({
              where: { userId, effectiveMonth: month },
              _sum: { change: true },
            });
            if (Credits.MONTHLY_CREDITS + (sum._sum.change ?? 0) <= 0) {
              return { refused: 'credits' };
            }
          }
          // Read inside the lock, as Earn's createSubmission does.
          const user = await tx.user.findUniqueOrThrow({
            where: { id: userId },
            select: { linkedTwitter: true },
          });
          const issues = submissionIssues(
            listing,
            linkedHandles(user.linkedTwitter),
            input,
          );
          if (issues.length > 0) return { issues };
          const existing = await tx.submission.findFirst({
            where: { userId, listingId: listing.id },
            select: { id: true },
          });
          if (existing) return { refused: 'exists' };
          const submission = await tx.submission.create({
            data: { userId, listingId: listing.id, ...stored(input) },
            select: { id: true },
          });
          if (!isHackathon) {
            await Effect.runPromiseWith(context)(
              credits.consume(tx, userId, submission.id),
            );
          }
          return { created: submission.id };
        }),
    );
    if ('refused' in outcome) return yield* refuse(outcome.refused);
    if ('issues' in outcome) {
      return yield* new InvalidSubmission({ issues: outcome.issues });
    }

    yield* queues.email({
      type: 'submissionTalent',
      id: listing.id,
      userId,
    });
    return outcome.created;
  });

  const update = Effect.fn('ListingSubmissions.update')(function* (
    userId: string,
    input: SubmissionInput,
  ) {
    const { listing, verifiedHandles } = yield* validate(
      userId,
      input.listingId,
      { skipLocationCooldown: true },
    );
    yield* checked(listing, verifiedHandles, input);
    const existing = yield* database.query('ownSubmission', (client) =>
      client.submission.findFirst({
        where: { userId, listingId: listing.id },
        select: { id: true, status: true, label: true },
      }),
    );
    if (!existing) return yield* refuse('missing');
    if (existing.status === 'Rejected' || existing.label === 'Spam') {
      return yield* refuse('rejected');
    }
    const updated = yield* database.query('updateSubmission', (client) =>
      client.submission.update({
        where: { id: existing.id },
        data: stored(input),
        select: { id: true },
      }),
    );
    return updated.id;
  });

  return ListingSubmissions.of({ create, update });
});

export const layer = Layer.effect(ListingSubmissions, make);
