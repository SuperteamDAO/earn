import 'server-only';

import * as Clock from 'effect/Clock';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';
import * as Schema from 'effect/Schema';

import * as Database from '@/server/database';
import * as GrantAirtable from '@/server/grant-airtable';
import {
  type ApplicationBody,
  timelineText,
  validateApplication,
} from '@/server/grant-application-rules';
import * as GrantPages from '@/server/grant-pages';
import * as GrantTranches from '@/server/grant-tranches';
import * as Kyc from '@/server/kyc';
import * as Locks from '@/server/locks';
import * as Queues from '@/server/queues';

import { isGrantApplicationInCooldown } from '@/features/grants/utils/grantApplicationCooldown';
import {
  sanitizeGrantApplicationAnswers,
  sanitizeGrantApplicationHtml,
  sanitizeGrantApplicationText,
} from '@/features/grants/utils/sanitizeGrantApplicationHtml';
import {
  COINDCX_GRANT_ID,
  isUserEligibleForST,
} from '@/features/grants/utils/stGrant';
import { getLocationCooldown } from '@/features/listings/utils/locationCooldown';
import { userRegionEligibilty } from '@/features/listings/utils/region';

// Why Earn refuses an application, as its routes answer it.
export class ApplicationRefused extends Schema.TaggedError<ApplicationRefused>()(
  'ApplicationRefused',
  {
    reason: Schema.Literals([
      // validateGrantRequest: the grant or the applicant can't apply now
      // (not found, unpublished, paused, blocked, no profile, region,
      // location cooldown), or the application can't be edited any more.
      'ineligible',
      // An event grant, and they aren't a Superteam member.
      'member',
      // A pending or approved application already.
      'exists',
      // Rejected less than 30 days ago.
      'cooldown',
      // The form's rules.
      'invalid',
      // Another grantee's wallet.
      'wallet',
    ]),
  },
) {
  override get message() {
    return `Application refused: ${this.reason}`;
  }
}

export class NotFound extends Schema.TaggedError<NotFound>()('NotFound', {}) {
  override get message() {
    return 'Grant application not found';
  }
}

export type KycResult =
  | 'verified'
  | 'timedOut'
  | { readonly status: 'failed'; readonly reason: string }
  | { readonly message: 'Not allowed' | 'KYC already verified' };

export interface TrancheBody {
  readonly applicationId: string;
  readonly walletAddress: string;
  readonly helpWanted?: unknown;
  readonly projectUpdate?: unknown;
  readonly eventPictures?: unknown;
  readonly eventReceipts?: unknown;
  readonly attendeeCount?: unknown;
  readonly socialPost?: unknown;
  readonly colosseumLink?: unknown;
  readonly githubRepo?: unknown;
  readonly aiReceipt?: unknown;
  readonly aiReceipts?: unknown;
}

// Applying for grants, as the applicant: Earn's grant-application routes.
export class GrantApplications extends Context.Service<
  GrantApplications,
  {
    readonly create: (
      userId: string,
      body: ApplicationBody,
    ) => Effect.Effect<void, ApplicationRefused | Database.DatabaseError>;
    // Edits their pending application.
    readonly update: (
      userId: string,
      body: ApplicationBody,
    ) => Effect.Effect<void, ApplicationRefused | Database.DatabaseError>;
    readonly requestTranche: (
      userId: string,
      body: TrancheBody,
    ) => Effect.Effect<
      void,
      GrantTranches.TrancheRefused | Locks.LockBusy | Database.DatabaseError
    >;
    // Earn's verify-completion: once Sumsub says yes, records their KYC
    // and the first tranche.
    readonly kycVerify: (
      userId: string,
      applicationId: string,
    ) => Effect.Effect<
      KycResult,
      | NotFound
      | Kyc.KycUnavailable
      | Kyc.KycError
      | Locks.LockBusy
      | GrantTranches.TrancheRefused
      | Database.DatabaseError
    >;
    // Likes or unlikes an application (the feed's like button).
    readonly like: (
      userId: string,
      applicationId: string,
    ) => Effect.Effect<void, Database.DatabaseError>;
  }
>()('earn/GrantApplications') {}

const refuse = (reason: ApplicationRefused['reason']) =>
  Effect.fail(new ApplicationRefused({ reason }));

const GRANT_FOR_APPLYING = {
  id: true,
  title: true,
  slug: true,
  isActive: true,
  isPublished: true,
  isPaused: true,
  region: true,
  minReward: true,
  maxReward: true,
  token: true,
  questions: true,
  isNative: true,
  airtableId: true,
  isST: true,
} as const;

const APPLICANT = {
  id: true,
  isBlocked: true,
  isTalentFilled: true,
  location: true,
  locationUpdatedAt: true,
  peopleId: true,
  telegram: true,
  linkedTwitter: true,
  people: { select: { chapterId: true, type: true } },
} as const;

const questionsOf = (value: unknown) =>
  Array.isArray(value)
    ? value.flatMap((question: unknown) =>
        typeof question === 'object' &&
        question !== null &&
        'question' in question &&
        typeof question.question === 'string'
          ? [
              {
                question: question.question,
                optional:
                  'optional' in question ? Boolean(question.optional) : false,
                type:
                  'type' in question && question.type === 'link'
                    ? ('link' as const)
                    : ('text' as const),
              },
            ]
          : [],
      )
    : [];

const linkedHandles = (value: unknown) =>
  Array.isArray(value)
    ? value.filter((handle): handle is string => typeof handle === 'string')
    : [];

const make = Effect.gen(function* () {
  const database = yield* Database.Database;
  const pages = yield* GrantPages.GrantPages;
  const tranches = yield* GrantTranches.GrantTranches;
  const airtable = yield* GrantAirtable.GrantAirtable;
  const queues = yield* Queues.Queues;
  const locks = yield* Locks.Locks;
  const kyc = yield* Kyc.Kyc;

  // Earn's validateGrantRequest.
  const eligible = Effect.fn('GrantApplications.eligible')(function* (
    userId: string,
    grantId: string,
    options: { skipLocationCooldown: boolean; allowPaused: boolean },
  ) {
    const [grant, user] = yield* database.query('applyingFor', (client) =>
      Promise.all([
        client.grants.findUnique({
          where: { id: grantId },
          select: GRANT_FOR_APPLYING,
        }),
        client.user.findUnique({ where: { id: userId }, select: APPLICANT }),
      ]),
    );
    if (
      !grant ||
      !grant.isActive ||
      !grant.isPublished ||
      (grant.isPaused && !options.allowPaused) ||
      !user ||
      user.isBlocked ||
      !user.isTalentFilled
    ) {
      return yield* refuse('ineligible');
    }
    const chapters = [...(yield* pages.chapters)];
    if (
      !userRegionEligibilty({
        region: grant.region,
        userLocation: user.location || '',
        chapters,
      })
    ) {
      return yield* refuse('ineligible');
    }
    if (
      !options.skipLocationCooldown &&
      getLocationCooldown({
        locationUpdatedAt: user.locationUpdatedAt,
        listingRegion: grant.region,
        userLocation: user.location,
        chapters,
      }).inCooldown
    ) {
      return yield* refuse('ineligible');
    }
    if (grant.isST && !isUserEligibleForST(user)) {
      return yield* refuse('member');
    }
    return { grant, user };
  });

  // The application as Earn stores it, or why not.
  const prepare = Effect.fn('GrantApplications.prepare')(function* (
    body: ApplicationBody,
    grant: Effect.Success<ReturnType<typeof eligible>>['grant'],
    user: Effect.Success<ReturnType<typeof eligible>>['user'],
    editing: boolean,
  ) {
    const valid = validateApplication(
      body,
      {
        title: grant.title,
        token: grant.token,
        minReward: grant.minReward,
        maxReward: grant.maxReward,
        isST: grant.isST,
        questions: questionsOf(grant.questions),
      },
      linkedHandles(user.linkedTwitter),
      { editing },
    );
    if (Option.isNone(valid)) return yield* refuse('invalid');
    const data = valid.value;
    const taken = yield* database.query('walletOwner', (client) =>
      GrantTranches.walletTaken(client, grant, user.id, data.walletAddress),
    );
    if (taken) return yield* refuse('wallet');
    return {
      data,
      row: {
        projectTitle: sanitizeGrantApplicationText(data.projectTitle),
        projectOneLiner: sanitizeGrantApplicationText(data.projectOneLiner),
        projectDetails: sanitizeGrantApplicationHtml(data.projectDetails),
        projectTimeline: timelineText(data.projectTimeline),
        proofOfWork: sanitizeGrantApplicationHtml(data.proofOfWork) || '',
        milestones: sanitizeGrantApplicationHtml(data.milestones),
        kpi: sanitizeGrantApplicationHtml(data.kpi) || '',
        walletAddress: data.walletAddress,
        ask: data.ask,
        twitter: data.twitter,
        github: data.github,
        answers: sanitizeGrantApplicationAnswers([...data.answers]) || [],
        ...(grant.isST && {
          lumaLink: data.lumaLink,
          expenseBreakdown: sanitizeGrantApplicationHtml(data.expenseBreakdown),
        }),
      },
    };
  });

  const create = Effect.fn('GrantApplications.create')(function* (
    userId: string,
    body: ApplicationBody,
  ) {
    const { grant, user } = yield* eligible(userId, body.grantId, {
      skipLocationCooldown: false,
      allowPaused: false,
    });
    const now = yield* Clock.currentTimeMillis;
    const [existing, rejected] = yield* database.query(
      'previousApplications',
      (client) =>
        Promise.all([
          client.grantApplication.findFirst({
            where: {
              grantId: grant.id,
              userId,
              applicationStatus: { in: ['Pending', 'Approved'] },
            },
            select: { id: true },
          }),
          client.grantApplication.findFirst({
            where: {
              grantId: grant.id,
              userId,
              applicationStatus: 'Rejected',
              isCooldownSkipped: false,
              decidedAt: { gte: new Date(now - 30 * 24 * 60 * 60 * 1000) },
            },
            orderBy: { decidedAt: 'desc' },
            select: { decidedAt: true },
          }),
        ]),
    );
    if (existing) return yield* refuse('exists');
    if (
      rejected?.decidedAt &&
      isGrantApplicationInCooldown(rejected.decidedAt)
    ) {
      return yield* refuse('cooldown');
    }
    const { data, row } = yield* prepare(body, grant, user, false);
    if (data.telegram && !user.telegram) {
      yield* database.query('saveTelegram', (client) =>
        client.user.update({
          where: { id: userId },
          data: { telegram: data.telegram },
        }),
      );
    }
    const created = yield* database.query('createApplication', (client) =>
      client.grantApplication.create({
        data: { userId, grantId: grant.id, ...row },
        select: GrantAirtable.AIRTABLE_APPLICATION,
      }),
    );
    if (grant.isNative || grant.airtableId) {
      yield* queues.email({ type: 'application', id: created.id, userId });
    }
    if (grant.airtableId) yield* airtable.syncApplication(created);
    return yield* Effect.void;
  });

  const update = Effect.fn('GrantApplications.update')(function* (
    userId: string,
    body: ApplicationBody,
  ) {
    const approved = yield* database.query('approvedApplication', (client) =>
      client.grantApplication.findFirst({
        where: { grantId: body.grantId, userId, applicationStatus: 'Approved' },
        select: { id: true },
      }),
    );
    if (approved) return yield* refuse('exists');
    const { grant, user } = yield* eligible(userId, body.grantId, {
      skipLocationCooldown: true,
      allowPaused: true,
    });
    const { row } = yield* prepare(body, grant, user, true);
    const previous = yield* database.query('latestApplication', (client) =>
      client.grantApplication.findFirst({
        where: { userId, grantId: grant.id },
        orderBy: { createdAt: 'desc' },
        select: { id: true, applicationStatus: true, label: true },
      }),
    );
    if (
      !previous ||
      previous.applicationStatus !== 'Pending' ||
      previous.label === 'Spam'
    ) {
      return yield* refuse('ineligible');
    }
    const updated = yield* database.query('updateApplication', (client) =>
      client.grantApplication.update({
        where: { id: previous.id },
        data: { userId, grantId: grant.id, ...row },
        select: GrantAirtable.AIRTABLE_APPLICATION,
      }),
    );
    if (grant.airtableId) yield* airtable.syncApplication(updated);
    return yield* Effect.void;
  });

  const requestTranche = Effect.fn('GrantApplications.requestTranche')(
    function* (userId: string, body: TrancheBody) {
      const aiReceipts =
        Array.isArray(body.aiReceipts) && body.aiReceipts.length > 0
          ? body.aiReceipts
          : typeof body.aiReceipt === 'string' && body.aiReceipt.trim()
            ? [body.aiReceipt]
            : undefined;
      yield* locks.with(
        `locks:create-tranche:${body.applicationId}`,
        tranches.create({
          applicationId: body.applicationId,
          requesterUserId: userId,
          helpWanted: body.helpWanted,
          update: body.projectUpdate,
          walletAddress: body.walletAddress,
          eventPictures: body.eventPictures,
          eventReceipts: body.eventReceipts,
          attendeeCount: body.attendeeCount,
          socialPost: body.socialPost,
          colosseumLink: body.colosseumLink,
          githubRepo: body.githubRepo,
          aiReceipts,
        }),
      );
    },
  );

  const kycVerify = Effect.fn('GrantApplications.kycVerify')(function* (
    userId: string,
    applicationId: string,
  ) {
    const application = yield* database.query('kycApplication', (client) =>
      client.grantApplication.findFirst({
        where: { id: applicationId, userId },
        select: {
          applicationStatus: true,
          user: { select: { isKYCVerified: true } },
          grant: { select: { id: true, airtableId: true, isNative: true } },
        },
      }),
    );
    if (!application) return yield* new NotFound();
    const allowed =
      application.grant.id !== COINDCX_GRANT_ID &&
      !!application.grant.airtableId &&
      application.grant.isNative &&
      application.applicationStatus === 'Approved';
    if (!allowed) return { message: 'Not allowed' } as const;

    const applicant = yield* kyc.applicant(userId);
    const result = yield* kyc.verification(applicant.id);
    if (result !== 'verified') return result;
    if (application.user.isKYCVerified) {
      return { message: 'KYC already verified' } as const;
    }
    yield* locks.with(
      `locks:create-tranche:${applicationId}:first-tranche`,
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
          }),
        );
        yield* tranches.create({ applicationId, isFirstTranche: true });
      }),
    );
    return 'verified' as const;
  });

  // Earn's updateLike: toggles their like, keeping the count.
  const like = Effect.fn('GrantApplications.like')(function* (
    userId: string,
    applicationId: string,
  ) {
    const now = yield* Clock.currentTimeMillis;
    yield* database.query('likeApplication', async (client) => {
      const row = await client.grantApplication.findFirst({
        where: { id: applicationId },
        select: { like: true },
      });
      const likes = Array.isArray(row?.like)
        ? row.like.filter(
            (entry): entry is { id: string; date: number } =>
              typeof entry === 'object' &&
              entry !== null &&
              'id' in entry &&
              typeof entry.id === 'string',
          )
        : [];
      const next = likes.some((entry) => entry.id === userId)
        ? likes.filter((entry) => entry.id !== userId)
        : [...likes, { id: userId, date: now }];
      await client.grantApplication.update({
        where: { id: applicationId },
        data: { like: next, likeCount: next.length },
      });
    });
  });

  return GrantApplications.of({
    create,
    update,
    requestTranche,
    kycVerify,
    like,
  });
});

export const layer = Layer.effect(GrantApplications, make);
