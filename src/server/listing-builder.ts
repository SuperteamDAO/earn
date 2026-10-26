import 'server-only';

import * as Clock from 'effect/Clock';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Schema from 'effect/Schema';
import { franc } from 'franc';
import slugify from 'slugify';

import type { Skills } from '@/interface/skills';
import type { Prisma } from '@/prisma/client';
import type { BountyType, CompensationType } from '@/prisma/enums';
import type { BountiesModel } from '@/prisma/models/Bounties';
import * as AppConfig from '@/server/app-config';
import * as Credits from '@/server/credits';
import * as Database from '@/server/database';
import * as Earncognito from '@/server/earncognito';
import {
  allowedRegion,
  type ListingBody,
  type ValidListing,
  validateListing,
  widensToGlobal,
} from '@/server/listing-rules';
import * as Queues from '@/server/queues';
import * as Tokens from '@/server/tokens';
import type { SponsorWriter } from '@/server/users';
import { canonicalizeRegionValue } from '@/utils/canonicalRegion';
import { cleanSkills } from '@/utils/cleanSkills';
import { dayjs } from '@/utils/dayjs';

import { BONUS_REWARD_POSITION } from '@/features/listing-builder/constants';
import type {
  BuilderHackathon,
  BuilderListing,
} from '@/features/listing-builder/types/builder';
import type { TEligibilityQuestion } from '@/features/listing-builder/types/schema';
import type { Rewards } from '@/features/listings/types';

class ListingNotFound extends Schema.TaggedError<ListingNotFound>()(
  'ListingNotFound',
  {},
) {
  override get message() {
    return 'Listing not found';
  }
}

// The listing is another sponsor's.
class NotYourListing extends Schema.TaggedError<NotYourListing>()(
  'NotYourListing',
  {},
) {
  override get message() {
    return 'Listing belongs to another sponsor';
  }
}

// A save Earn refuses in the listing's state, with Earn's words for why.
export class ListingRefused extends Schema.TaggedError<ListingRefused>()(
  'ListingRefused',
  { status: Schema.Literals([400, 403]), refusal: Schema.String },
) {
  override get message() {
    return `Listing refused: ${this.refusal}`;
  }
}

export class InvalidListing extends Schema.TaggedError<InvalidListing>()(
  'InvalidListing',
  { errors: Schema.Record(Schema.String, Schema.String) },
) {
  override get message() {
    return `Invalid listing: ${Object.keys(this.errors).join(', ')}`;
  }
}

type Failure =
  | ListingNotFound
  | NotYourListing
  | ListingRefused
  | InvalidListing
  | Database.DatabaseError;

// What the builder page renders.
export type BuilderPage =
  | {
      readonly kind: 'ready';
      readonly listing: BuilderListing | null;
      readonly hackathons: ReadonlyArray<BuilderHackathon>;
      // Fewer than five of the sponsor's listings wait for winners.
      readonly createAllowed: boolean;
    }
  | { readonly kind: 'not-found' }
  // Another sponsor's listing: switch to it when they may (`sponsorId`),
  // else back to the dashboard.
  | { readonly kind: 'other-sponsor'; readonly sponsorId: string | null };

export type Published = BountiesModel & {
  readonly reason: string;
  readonly isFirstPublishedListing: boolean;
};

export class ListingBuilder extends Context.Service<
  ListingBuilder,
  {
    readonly page: (
      privyDid: string,
      slug: string | null,
    ) => Effect.Effect<BuilderPage, Database.DatabaseError>;
    readonly createAllowed: (
      sponsorId: string,
    ) => Effect.Effect<boolean, Database.DatabaseError>;
    // Autosave: creates or updates an unpublished listing.
    readonly saveDraft: (
      writer: SponsorWriter,
      body: ListingBody,
    ) => Effect.Effect<BountiesModel, Failure>;
    readonly publish: (
      writer: SponsorWriter,
      id: string,
      body: ListingBody,
    ) => Effect.Effect<Published, Failure>;
    readonly update: (
      writer: SponsorWriter,
      id: string,
      body: ListingBody,
    ) => Effect.Effect<BountiesModel, Failure>;
    readonly unpublish: (
      writer: SponsorWriter,
      id: string,
    ) => Effect.Effect<BountiesModel, Failure>;
    // Hides a draft (Earn never deletes rows).
    readonly remove: (
      writer: SponsorWriter,
      id: string,
    ) => Effect.Effect<void, Failure>;
    // Whether another listing has this slug.
    readonly slugTaken: (
      slug: string,
      id: string | null,
    ) => Effect.Effect<boolean, Database.DatabaseError>;
    // A free slug from a title.
    readonly uniqueSlug: (
      title: string,
      id: string | null,
    ) => Effect.Effect<string, Database.DatabaseError>;
  }
>()('earn/ListingBuilder') {}

const WITH_SPONSOR = {
  sponsor: { include: { chapter: true } },
} as const satisfies Prisma.BountiesInclude;

type ListingWithSponsor = Prisma.BountiesGetPayload<{
  include: typeof WITH_SPONSOR;
}>;

const HACKATHON = {
  id: true,
  name: true,
  slug: true,
  logo: true,
  altLogo: true,
  startDate: true,
  deadline: true,
  eligibility: true,
} as const satisfies Prisma.HackathonSelect;

type HackathonRow = Prisma.HackathonGetPayload<{ select: typeof HACKATHON }>;

const iso = (date: Date | null | undefined) => date?.toISOString() ?? null;

// Json columns hold what Earn's forms wrote; the builder reads them as such.
// oxlint-disable typescript/no-unsafe-type-assertion
const asQuestions = (value: Prisma.JsonValue) =>
  (value ?? null) as TEligibilityQuestion[] | null;
const asRewards = (value: Prisma.JsonValue) =>
  (value ?? null) as Rewards | null;
const asSkills = (value: Prisma.JsonValue) => (value ?? null) as Skills | null;
// oxlint-enable typescript/no-unsafe-type-assertion

const hackathonOf = (row: HackathonRow): BuilderHackathon => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  logo: row.logo,
  altLogo: row.altLogo,
  startDate: iso(row.startDate),
  deadline: iso(row.deadline),
  eligibility: asQuestions(row.eligibility),
});

const BOUNTY_TYPES: ReadonlyArray<BountyType> = ['bounty', 'hackathon'];
const COMPENSATION_TYPES: ReadonlyArray<CompensationType> = [
  'fixed',
  'range',
  'variable',
];
const bountyType = (value: string | null | undefined) =>
  BOUNTY_TYPES.find((type) => type === value);
const compensationType = (value: string | null | undefined) =>
  COMPENSATION_TYPES.find((type) => type === value);

// A JSON body's value (or a form's), so already JSON; Json columns take
// undefined for "leave as is".
const json = <A extends Prisma.InputJsonValue>(
  value: A | null | undefined,
): A | undefined => value ?? undefined;

const skillsOf = (skills: ListingBody['skills']) =>
  // cleanSkills keeps only known subskills, under their real parent.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  cleanSkills((skills ?? []) as Skills);

// Earn's calculateTotalPrizes(rewards, 0): the podium's places.
const podiumPlaces = (rewards: Readonly<Record<string, number>> | null) =>
  Object.keys(rewards ?? {})
    .map(Number)
    .filter((key) => !Number.isNaN(key) && key !== BONUS_REWARD_POSITION)
    .length;

const make = Effect.gen(function* () {
  const database = yield* Database.Database;
  const config = yield* AppConfig.AppConfig;
  const queues = yield* Queues.Queues;
  const earncognito = yield* Earncognito.Earncognito;
  const credits = yield* Credits.Credits;
  const tokens = yield* Tokens.Tokens;

  // Earn's validateListingSponsorAuth.
  const owned = Effect.fn('ListingBuilder.owned')(function* (
    sponsorId: string,
    id: string,
  ) {
    const listing = yield* database.query('builderListing', (client) =>
      client.bounties.findUnique({ where: { id }, include: WITH_SPONSOR }),
    );
    if (!listing) return yield* new ListingNotFound();
    if (listing.sponsorId !== sponsorId) return yield* new NotYourListing();
    return listing;
  });

  const activeHackathons = database.query('activeHackathons', (client) =>
    client.hackathon.findMany({
      where: {
        deadline: { not: null, gt: new Date() },
        OR: [
          { slug: 'crypto-worlds-fair' },
          { Sponsor: { chapter: { isNot: null } } },
        ],
      },
      select: HACKATHON,
    }),
  );

  const createAllowed = Effect.fn('ListingBuilder.createAllowed')(function* (
    sponsorId: string,
  ) {
    const waiting = yield* database.query('listingsAwaitingWinners', (client) =>
      client.bounties.count({
        where: {
          sponsorId,
          isPublished: true,
          isActive: true,
          deadline: { lte: new Date() },
          isWinnersAnnounced: false,
        },
      }),
    );
    return waiting < 5;
  });

  const page = Effect.fn('ListingBuilder.page')(function* (
    privyDid: string,
    slug: string | null,
  ) {
    const user = yield* database.query('builderUser', (client) =>
      client.user.findUnique({
        where: { privyDid },
        select: {
          currentSponsorId: true,
          role: true,
          UserSponsors: { select: { sponsorId: true } },
        },
      }),
    );
    if (!user) return { kind: 'not-found' } satisfies BuilderPage;

    const [hackathons, allowed] = yield* Effect.all(
      [
        activeHackathons,
        user.currentSponsorId
          ? createAllowed(user.currentSponsorId)
          : Effect.succeed(true),
      ],
      { concurrency: 2 },
    );
    if (!slug) {
      return {
        kind: 'ready',
        listing: null,
        hackathons: hackathons.map(hackathonOf),
        createAllowed: allowed,
      } satisfies BuilderPage;
    }

    const row = yield* database.query('builderListingBySlug', (client) =>
      client.bounties.findFirst({
        where: { slug, isActive: true },
        include: { Hackathon: { select: HACKATHON } },
      }),
    );
    if (!row) return { kind: 'not-found' } satisfies BuilderPage;
    if (row.sponsorId !== user.currentSponsorId) {
      const mayAccess =
        user.role === 'GOD' ||
        user.UserSponsors.some(
          (membership) => membership.sponsorId === row.sponsorId,
        );
      return {
        kind: 'other-sponsor',
        sponsorId: mayAccess ? row.sponsorId : null,
      } satisfies BuilderPage;
    }
    const totalPaymentsMade = yield* database.query(
      'listingPayments',
      (client) =>
        client.submission.count({ where: { listingId: row.id, isPaid: true } }),
    );
    const own = row.Hackathon ? hackathonOf(row.Hackathon) : null;
    const listing: BuilderListing = {
      id: row.id,
      title: row.title,
      slug: row.slug,
      description: row.description,
      deadline: iso(row.deadline),
      commitmentDate: iso(row.commitmentDate),
      eligibility: asQuestions(row.eligibility),
      status: row.status,
      token: row.token,
      rewardAmount: row.rewardAmount,
      rewards: asRewards(row.rewards),
      maxBonusSpots: row.maxBonusSpots,
      sponsorId: row.sponsorId,
      pocSocials: row.pocSocials,
      skills: asSkills(row.skills),
      type: row.type,
      region: row.region,
      templateId: row.templateId,
      hackathonId: row.hackathonId,
      isPublished: row.isPublished,
      isFeatured: row.isFeatured,
      isPrivate: row.isPrivate,
      isFndnPaying: row.isFndnPaying,
      isWinnersAnnounced: row.isWinnersAnnounced,
      publishedAt: iso(row.publishedAt),
      compensationType: row.compensationType,
      minRewardAsk: row.minRewardAsk,
      maxRewardAsk: row.maxRewardAsk,
      referredBy: row.referredBy,
      totalPaymentsMade,
      Hackathon: own,
    };
    // A track's own hackathon stays choosable after it closes.
    const choices =
      row.type === 'hackathon' && own
        ? [
            own,
            ...hackathons
              .filter((hackathon) => hackathon.slug !== own.slug)
              .map(hackathonOf),
          ]
        : hackathons.map(hackathonOf);
    return {
      kind: 'ready',
      listing,
      hackathons: choices,
      createAllowed: allowed,
    } satisfies BuilderPage;
  });

  const slugTaken = Effect.fn('ListingBuilder.slugTaken')(function* (
    slug: string,
    id: string | null,
  ) {
    const found = yield* database.query('slugTaken', (client) =>
      client.bounties.findFirst({
        where: { slug, NOT: id ? { id } : undefined },
        select: { id: true },
      }),
    );
    return found !== null;
  });

  const uniqueSlug = Effect.fn('ListingBuilder.uniqueSlug')(function* (
    title: string,
    id: string | null,
  ) {
    const base = slugify(title.replace(/\|/g, ''), {
      lower: true,
      strict: true,
    });
    const taken = new Set(
      (yield* database.query('similarSlugs', (client) =>
        client.bounties.findMany({
          where: { slug: { startsWith: base }, NOT: id ? { id } : undefined },
          select: { slug: true },
        }),
      )).map((row) => row.slug),
    );
    if (!taken.has(base)) return base;
    let i = 1;
    while (taken.has(`${base}-${i}`)) i++;
    return `${base}-${i}`;
  });

  const chapters = database.query('chapterRegions', (client) =>
    client.chapter.findMany({
      where: { active: true },
      select: { region: true, code: true },
    }),
  );

  const validRegion = (value: string | null | undefined) =>
    chapters.pipe(
      Effect.map((rows) =>
        allowedRegion(
          value,
          rows.map((row) => ({ region: row.region, code: row.code ?? '' })),
        ),
      ),
    );

  const saveDraft = Effect.fn('ListingBuilder.saveDraft')(function* (
    writer: SponsorWriter,
    body: ListingBody,
  ) {
    let region = body.region;
    if (region) {
      const valid = yield* validRegion(region);
      if (!valid) {
        return yield* new ListingRefused({
          status: 400,
          refusal: 'Invalid region selected',
        });
      }
      region = valid;
    }

    const listing = body.id ? yield* owned(writer.sponsorId, body.id) : null;
    if (
      listing &&
      region &&
      widensToGlobal({
        currentRegion: listing.region,
        nextRegion: region,
        hasChapter: !!listing.sponsor.chapter,
      })
    ) {
      return yield* new ListingRefused({
        status: 400,
        refusal: 'Chapter sponsors cannot edit a listing region to Global',
      });
    }
    // Earn's isListingDraftable.
    if (listing?.isPublished) {
      return yield* new ListingRefused({
        status: 403,
        refusal: 'Published Listings are not allowed to be draft',
      });
    }
    if (
      listing &&
      listing.status !== 'OPEN' &&
      listing.status !== 'VERIFYING'
    ) {
      return yield* new ListingRefused({
        status: 403,
        refusal: `Listing has status ${listing.status}, hence not allowed to edit`,
      });
    }

    const title = body.title || 'Untitled Draft';
    // Earn's getValidSlug: a taken slug keeps the saved one; a new draft
    // gets a free one from its slug or title.
    let slug = body.slug || undefined;
    if (slug && body.id && slug !== listing?.slug) {
      if (yield* slugTaken(slug, body.id)) slug = listing?.slug;
    }
    if (!body.id) slug = yield* uniqueSlug(slug ?? title, null);
    const now = yield* Clock.currentTimeMillis;

    const data = {
      title,
      slug: slug || `untitled-draft-${now}`,
      description: body.description ?? undefined,
      deadline: body.deadline ? new Date(body.deadline) : undefined,
      commitmentDate: body.commitmentDate
        ? new Date(body.commitmentDate)
        : undefined,
      pocSocials: body.pocSocials ?? undefined,
      templateId: body.templateId ?? undefined,
      type: bountyType(body.type),
      region: region ? canonicalizeRegionValue(region) : undefined,
      eligibility: json(body.eligibility),
      rewardAmount: body.rewardAmount ?? undefined,
      rewards: json(body.rewards),
      maxBonusSpots:
        body.maxBonusSpots === undefined ? undefined : body.maxBonusSpots || 0,
      token: body.token ?? undefined,
      compensationType: compensationType(body.compensationType),
      minRewardAsk: body.minRewardAsk ?? undefined,
      maxRewardAsk: body.maxRewardAsk ?? undefined,
      isPrivate: body.isPrivate ?? undefined,
      skills: body.skills ? json(skillsOf(body.skills)) : undefined,
      language: body.description ? franc(body.description) : 'eng',
      sponsorId: writer.sponsorId,
      isFndnPaying: body.isFndnPaying ?? undefined,
      hackathonId: body.hackathonId ?? undefined,
      referredBy: body.referredBy ?? undefined,
      pocId: listing?.pocId || writer.userId,
    } satisfies Prisma.BountiesUncheckedCreateInput;

    return yield* database.query('saveDraft', (client) =>
      listing
        ? client.bounties.update({ where: { id: listing.id }, data })
        : client.bounties.create({ data }),
    );
  });

  // Earn's buildListingContext and validateListing: the rules, with what
  // the database says about slug, token, hackathon and region.
  const validated = Effect.fn('ListingBuilder.validated')(function* (
    writer: SponsorWriter,
    listing: ListingWithSponsor,
    input: ListingBody,
    isEditing: boolean,
  ) {
    const [hackathon, user, slugIsTaken, token] = yield* Effect.all(
      [
        input.hackathonId
          ? database.query('builderHackathon', (client) =>
              client.hackathon.findUnique({
                where: { id: input.hackathonId ?? '' },
                select: { id: true, deadline: true },
              }),
            )
          : Effect.succeed(null),
        database.query('builderRole', (client) =>
          client.user.findUnique({
            where: { id: writer.userId },
            select: { id: true, role: true },
          }),
        ),
        input.slug
          ? slugTaken(
              input.slug.trim().replace(/^[-\s]+|[-\s]+$/g, ''),
              input.id ?? listing.id,
            )
          : Effect.succeed(false),
        tokens.bySymbol(
          (input.token ?? (listing.sponsor.chapter ? 'USDG' : 'USDC')).trim(),
        ),
      ],
      { concurrency: 4 },
    );
    if (!user) return yield* new ListingNotFound();
    const isGod = user.role === 'GOD';
    const result = validateListing(
      input,
      {
        isGod,
        isEditing,
        isST: !!listing.sponsor.chapter,
        hackathon,
        pastDeadline: isEditing ? listing.deadline : null,
        now: yield* Clock.currentTimeMillis,
      },
      {
        slugTaken: slugIsTaken,
        tokenAllowed: token !== null,
      },
    );
    if ('errors' in result) {
      return yield* new InvalidListing({ errors: result.errors });
    }
    const region = yield* validRegion(result.listing.region);
    if (!region) {
      return yield* new InvalidListing({
        errors: { region: 'Invalid region selected' },
      });
    }
    if (
      isEditing &&
      widensToGlobal({
        currentRegion: listing.region,
        nextRegion: region,
        hasChapter: !!listing.sponsor.chapter,
      })
    ) {
      return yield* new InvalidListing({
        errors: {
          region: 'Chapter sponsors cannot edit a listing region to Global',
        },
      });
    }
    return { listing: { ...result.listing, region }, isGod };
  });

  // Earn's sponsorVerificationCheck: whether a first publish waits for
  // Superteam's approval (VERIFYING), and why.
  const verification = Effect.fn('ListingBuilder.verification')(function* (
    listing: ListingWithSponsor,
    valid: ValidListing,
    isGod: boolean,
  ) {
    // Earn verifies only on its own deployment (IS_EARN_BASE).
    if (!config.earnProduction) {
      return { isVerifying: false, reason: 'Earn Base is true' };
    }
    if (listing.isPublished) {
      return { isVerifying: false, reason: 'Already published' };
    }
    if (listing.publishedAt) {
      return {
        isVerifying: false,
        reason: 'Unpublished Listing does not need verification',
      };
    }
    const sponsor = listing.sponsor;
    if (valid.type === 'hackathon' && !isGod && !sponsor.chapter) {
      return { isVerifying: true, reason: 'Hackathon Listing' };
    }
    if (sponsor.isVerified || isGod) {
      return { isVerifying: false, reason: 'Sponsor verified or GOD user' };
    }
    if (sponsor.isCaution) {
      return { isVerifying: true, reason: 'Sponsor marked as caution' };
    }
    const live = yield* database.query('sponsorLiveListings', (client) =>
      client.bounties.count({
        where: {
          sponsorId: sponsor.id,
          isArchived: false,
          isPublished: true,
          isActive: true,
        },
      }),
    );
    if (live === 0) {
      const unpublished = yield* database.query(
        'sponsorUnpublishedListings',
        (client) =>
          client.bounties.count({
            where: {
              sponsorId: sponsor.id,
              isArchived: false,
              isPublished: false,
              isActive: true,
              publishedAt: { not: null },
            },
          }),
      );
      return {
        isVerifying: true,
        reason: unpublished > 0 ? 'Has unannounced winners' : 'New sponsor',
      };
    }
    const now = yield* Clock.currentTimeMillis;
    const overdue = yield* database.query('sponsorOverdueListing', (client) =>
      client.bounties.findFirst({
        select: { id: true },
        where: {
          sponsorId: sponsor.id,
          isArchived: false,
          isPublished: true,
          isActive: true,
          isWinnersAnnounced: false,
          deadline: { lt: dayjs(now).subtract(2, 'weeks').toDate() },
        },
      }),
    );
    if (overdue) {
      return { isVerifying: true, reason: 'Has unannounced winners' };
    }
    return { isVerifying: false, reason: 'All checks passed' };
  });

  const usdPriceOf = (symbol: string) =>
    tokens
      .bySymbol(symbol, { includeInactive: true })
      .pipe(
        Effect.flatMap((token) =>
          token?.mintAddress
            ? tokens.usdPrice(token.mintAddress)
            : Effect.succeed(null),
        ),
      );

  // Earn's transformToPrismaData for publish and update.
  const prismaData = Effect.fn('ListingBuilder.prismaData')(function* ({
    valid,
    listing,
    isEditing,
    isVerifying,
    userId,
  }: {
    readonly valid: ValidListing;
    readonly listing: ListingWithSponsor;
    readonly isEditing: boolean;
    readonly isVerifying: boolean;
    readonly userId: string;
  }) {
    const amount =
      valid.compensationType === 'fixed' ? valid.rewardAmount || 0 : 0;
    let tokenUsdAtPublish: number | undefined;
    let usdValue: number | undefined;
    if (!isVerifying) {
      if (!isEditing) {
        if (valid.token && amount > 0) {
          const price = yield* usdPriceOf(valid.token);
          if (price !== null) {
            tokenUsdAtPublish = price;
            usdValue = price * amount;
          }
        }
      } else if (listing.publishedAt && amount > 0) {
        let price = listing.tokenUsdAtPublish ?? undefined;
        if ((listing.token ?? undefined) !== valid.token && valid.token) {
          const fresh = yield* usdPriceOf(valid.token);
          if (fresh !== null) {
            price = fresh;
            tokenUsdAtPublish = fresh;
          }
        }
        if (typeof price === 'number') usdValue = price * amount;
      }
    }

    const base = {
      title: valid.title,
      ...(usdValue === undefined ? {} : { usdValue }),
      skills: json(skillsOf(valid.skills)) ?? [],
      slug: valid.slug,
      deadline: new Date(valid.deadline),
      commitmentDate: new Date(valid.commitmentDate),
      templateId: valid.templateId || null,
      pocSocials: valid.pocSocials,
      description: valid.description,
      type: valid.type,
      region: valid.region,
      eligibility: json(valid.eligibility) ?? (isEditing ? [] : undefined),
      rewardAmount: valid.rewardAmount,
      rewards: json(valid.rewards) ?? (isEditing ? {} : undefined),
      token: valid.token,
      compensationType: valid.compensationType,
      minRewardAsk: valid.minRewardAsk,
      maxRewardAsk: valid.maxRewardAsk,
      isPrivate: valid.isPrivate,
      language: valid.description ? franc(valid.description) : 'eng',
      // Only a chapter's sponsor has the foundation pay.
      isFndnPaying: listing.sponsor.chapter ? valid.isFndnPaying : false,
      hackathonId: valid.hackathonId,
      referredBy: valid.referredBy,
      sponsorId: listing.sponsorId,
      publishedBy: isEditing ? listing.publishedBy : userId,
      ...(tokenUsdAtPublish === undefined ? {} : { tokenUsdAtPublish }),
    } satisfies Prisma.BountiesUncheckedUpdateInput;

    if (isEditing) {
      return {
        ...base,
        maxBonusSpots: valid.maxBonusSpots || 0,
        isWinnersAnnounced: listing.isWinnersAnnounced,
        winnersAnnouncedAt: listing.winnersAnnouncedAt,
        isPublished: listing.isPublished,
        publishedAt: listing.publishedAt,
        status: listing.status,
        id: listing.id,
      } satisfies Prisma.BountiesUncheckedUpdateInput;
    }
    const now = yield* Clock.currentTimeMillis;
    return {
      ...base,
      maxBonusSpots: valid.maxBonusSpots ?? undefined,
      status: isVerifying ? 'VERIFYING' : 'OPEN',
      publishedAt: isVerifying ? null : new Date(now),
      isPublished: !isVerifying,
      isWinnersAnnounced: false,
      winnersAnnouncedAt: null,
    } satisfies Prisma.BountiesUncheckedUpdateInput;
  });

  // Earn's handlePostSaveOperations: Discord, the deadline comment and
  // email, and Telegram's new-listing post. None of it fails the save.
  const afterSave = Effect.fn('ListingBuilder.afterSave')(function* ({
    result,
    original,
    userId,
    isEditing,
    isVerifying,
    reason,
  }: {
    readonly result: BountiesModel;
    readonly original: ListingWithSponsor;
    readonly userId: string;
    readonly isEditing: boolean;
    readonly isVerifying: boolean;
    readonly reason?: string;
  }) {
    const status = isEditing
      ? 'Updated'
      : result.isPublished
        ? 'Published'
        : isVerifying
          ? `To be Verified${reason ? `: ${reason}` : ''}`
          : 'Draft Added';
    yield* earncognito
      .post('/discord/listing-update', { listingId: result.id, status })
      .pipe(
        Effect.catch(() =>
          Effect.logError('Discord listing update failed').pipe(
            Effect.annotateLogs({ id: result.id }),
          ),
        ),
      );

    const deadlineChanged =
      original.deadline?.getTime() !== result.deadline?.getTime();
    if (isEditing && deadlineChanged && result.isPublished) {
      yield* database
        .query('deadlineComment', (client) =>
          client.comment.create({
            data: {
              message: `The deadline for this listing has been updated to ${dayjs.utc(result.deadline).format('h:mm A, MMMM D, YYYY (UTC)')}`,
              refId: result.id,
              refType: 'BOUNTY',
              authorId: userId,
              type: 'DEADLINE_EXTENSION',
            },
          }),
        )
        .pipe(
          Effect.andThen(
            queues.email({ type: 'deadlineExtended', id: result.id }),
          ),
          Effect.catch(() =>
            Effect.logError('Deadline change notice failed').pipe(
              Effect.annotateLogs({ id: result.id }),
            ),
          ),
        );
    }

    if (!isEditing) {
      yield* queues.email({
        type: 'telegramNewListing',
        id: result.id,
        delay: 3 * 60 * 60 * 1000,
      });
    }
  });

  const publish = Effect.fn('ListingBuilder.publish')(function* (
    writer: SponsorWriter,
    id: string,
    body: ListingBody,
  ) {
    const listing = yield* owned(writer.sponsorId, id);
    const previouslyPublished = yield* database.query(
      'sponsorPublishedCount',
      (client) =>
        client.bounties.count({
          where: { sponsorId: writer.sponsorId, publishedAt: { not: null } },
        }),
    );
    if (listing.isPublished) {
      return yield* new ListingRefused({
        status: 400,
        refusal:
          'Listing is already published, hence cannot be published again',
      });
    }
    const { listing: valid, isGod } = yield* validated(
      writer,
      listing,
      body,
      false,
    );
    const { isVerifying, reason } = yield* verification(listing, valid, isGod);
    const data = yield* prismaData({
      valid,
      listing,
      isEditing: false,
      isVerifying,
      userId: writer.userId,
    });
    const result = yield* database.query('publishListing', (client) =>
      client.bounties.update({ where: { id }, data }),
    );
    yield* afterSave({
      result,
      original: listing,
      userId: writer.userId,
      isEditing: false,
      isVerifying,
      reason,
    });
    return {
      ...result,
      reason,
      isFirstPublishedListing: result.isPublished && previouslyPublished === 0,
    };
  });

  const update = Effect.fn('ListingBuilder.update')(function* (
    writer: SponsorWriter,
    id: string,
    body: ListingBody,
  ) {
    const listing = yield* owned(writer.sponsorId, id);
    const role = yield* database.query('builderRole', (client) =>
      client.user.findUnique({
        where: { id: writer.userId },
        select: { role: true },
      }),
    );
    // Earn's validateUpdatePermissions.
    if (role?.role !== 'GOD') {
      const isChapter = Boolean(listing.sponsor.chapter?.id);
      const now = yield* Clock.currentTimeMillis;
      const pastDeadline = listing.deadline
        ? now > listing.deadline.getTime()
        : false;
      if (isChapter && listing.isWinnersAnnounced) {
        return yield* new ListingRefused({
          status: 400,
          refusal: 'Listing winners are announced, hence cannot be edited',
        });
      }
      if (pastDeadline && !isChapter) {
        return yield* new ListingRefused({
          status: 400,
          refusal: 'Listing is past deadline, hence cannot be edited',
        });
      }
      if (!listing.isPublished) {
        return yield* new ListingRefused({
          status: 400,
          refusal: 'Listing is not published, hence cannot be edited',
        });
      }
    }

    // Earn validated the saved listing overlaid with the form.
    const saved: ListingBody = {
      id: listing.id,
      title: listing.title,
      slug: listing.slug,
      pocSocials: listing.pocSocials,
      description: listing.description,
      type: listing.type,
      region: listing.region,
      referredBy: listing.referredBy,
      deadline: iso(listing.deadline),
      commitmentDate: iso(listing.commitmentDate),
      templateId: listing.templateId,
      token: listing.token,
      rewardAmount: listing.rewardAmount,
      compensationType: listing.compensationType,
      minRewardAsk: listing.minRewardAsk,
      maxRewardAsk: listing.maxRewardAsk,
      maxBonusSpots: listing.maxBonusSpots,
      isFndnPaying: listing.isFndnPaying,
      isPrivate: listing.isPrivate,
      hackathonId: listing.hackathonId,
    };
    const merged: ListingBody = { ...saved };
    for (const [key, value] of Object.entries(body)) {
      if (value !== undefined) Object.assign(merged, { [key]: value });
    }
    if (body.eligibility === undefined) {
      Object.assign(merged, { eligibility: asQuestions(listing.eligibility) });
    }
    if (body.rewards === undefined) {
      Object.assign(merged, { rewards: asRewards(listing.rewards) });
    }
    if (body.skills === undefined) {
      Object.assign(merged, { skills: asSkills(listing.skills) });
    }

    const { listing: valid } = yield* validated(writer, listing, merged, true);
    const data = yield* prismaData({
      valid,
      listing,
      isEditing: true,
      isVerifying: false,
      userId: writer.userId,
    });

    // Earn's handleWinnerResets, right before the update: winners beyond
    // the new podium, and bonus winners beyond the new spots, lose it.
    const places = podiumPlaces(valid.rewards);
    const winners = yield* database.query('regularWinners', (client) =>
      client.submission.count({
        where: {
          listingId: id,
          isWinner: true,
          winnerPosition: { gt: 0, not: BONUS_REWARD_POSITION },
        },
      }),
    );
    for (let position = places + 1; position <= winners; position++) {
      yield* database.query('resetWinner', (client) =>
        client.submission.updateMany({
          where: { listingId: id, isWinner: true, winnerPosition: position },
          data: { isWinner: false, winnerPosition: null },
        }),
      );
    }
    const spots = valid.maxBonusSpots ?? 0;
    const bonusWinners = yield* database.query('bonusWinners', (client) =>
      client.submission.count({
        where: {
          listingId: id,
          isWinner: true,
          winnerPosition: BONUS_REWARD_POSITION,
        },
      }),
    );
    if (bonusWinners > spots) {
      const extra = yield* database.query('extraBonusWinners', (client) =>
        client.submission.findMany({
          where: {
            listingId: id,
            isWinner: true,
            winnerPosition: BONUS_REWARD_POSITION,
          },
          select: { id: true },
          orderBy: { createdAt: 'asc' },
          take: bonusWinners - spots,
        }),
      );
      yield* database.query('resetBonusWinners', (client) =>
        client.submission.updateMany({
          where: {
            id: { in: extra.map((row) => row.id) },
            listingId: id,
            isWinner: true,
            winnerPosition: BONUS_REWARD_POSITION,
          },
          data: { isWinner: false, winnerPosition: null },
        }),
      );
    }

    yield* database.query('updateListing', (client) =>
      client.bounties.update({ where: { id }, data }),
    );
    const result = yield* database.query('updatedListing', (client) =>
      client.bounties.findUniqueOrThrow({
        where: { id },
        include: { sponsor: true },
      }),
    );
    yield* afterSave({
      result,
      original: listing,
      userId: writer.userId,
      isEditing: true,
      isVerifying: listing.status === 'VERIFYING',
    });
    return result;
  });

  const unpublish = Effect.fn('ListingBuilder.unpublish')(function* (
    writer: SponsorWriter,
    id: string,
  ) {
    const listing = yield* owned(writer.sponsorId, id);
    const refusal = !listing.isPublished
      ? 'Listing is not published, cannot unpublish'
      : !listing.isActive
        ? 'Listing is not active, cannot unpublish'
        : listing.isArchived
          ? 'Listing is archived, cannot unpublish'
          : listing.status !== 'OPEN'
            ? 'Listing is not open, cannot unpublish'
            : listing.isWinnersAnnounced
              ? 'Listing has announced winners, cannot unpublish'
              : null;
    if (refusal) return yield* new ListingRefused({ status: 400, refusal });

    const result = yield* database.query('unpublishListing', (client) =>
      client.bounties.update({ where: { id }, data: { isPublished: false } }),
    );
    yield* database.query('resetWinners', (client) =>
      client.submission.updateMany({
        where: { listingId: id, isWinner: true },
        data: { isWinner: false, winnerPosition: null },
      }),
    );
    yield* credits.refundListing(id);
    yield* earncognito
      .post('/discord/listing-update', { listingId: id, status: 'Unpublished' })
      .pipe(
        Effect.catch(() => Effect.logError('Discord unpublish message failed')),
      );
    yield* earncognito
      .post('/telegram/unpublish-listing', { listingId: id })
      .pipe(
        Effect.catch(() =>
          Effect.logError('Telegram unpublish message failed'),
        ),
      );
    return result;
  });

  const remove = Effect.fn('ListingBuilder.remove')(function* (
    writer: SponsorWriter,
    id: string,
  ) {
    const listing = yield* owned(writer.sponsorId, id);
    if (listing.status !== 'OPEN' || listing.isPublished) {
      return yield* new ListingRefused({
        status: 400,
        refusal: 'Only draft bounties can be deleted',
      });
    }
    return yield* database
      .query('deleteDraft', (client) =>
        client.bounties.update({ where: { id }, data: { isActive: false } }),
      )
      .pipe(Effect.asVoid);
  });

  return ListingBuilder.of({
    page,
    createAllowed,
    saveDraft,
    publish,
    update,
    unpublish,
    remove,
    slugTaken,
    uniqueSlug,
  });
});

export const layer = Layer.effect(ListingBuilder, make);
