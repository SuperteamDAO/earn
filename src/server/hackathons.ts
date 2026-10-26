import 'server-only';

import * as Clock from 'effect/Clock';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';
import * as Schema from 'effect/Schema';

import type {
  BountiesOrderByWithRelationInput,
  BountiesWhereInput,
} from '@/prisma/models/Bounties';
import type { HackathonGetPayload } from '@/prisma/models/Hackathon';
import * as Database from '@/server/database';
import * as HomeChapters from '@/server/home-chapters';
import { combinedRegionsFor } from '@/server/home-regions';

import type { ListingCardData } from '@/features/home/types/cards';

export class HackathonNotFound extends Schema.TaggedError<HackathonNotFound>()(
  'HackathonNotFound',
  {},
) {
  override get message() {
    return 'Hackathon not found';
  }
}

// The /api/hackathon list's parameters (Earn's HackathonQueryParamsSchema).
export const HACKATHON_NAMES = [
  'Mobius',
  'Redacted',
  'Breakout',
  'Frontier',
  'World Cup',
  'All',
] as const;
export const HackathonListQuery = Schema.Struct({
  order: Schema.Literals(['asc', 'desc']),
  name: Schema.Literals(HACKATHON_NAMES),
  status: Schema.Literals(['open', 'review', 'completed']),
  sortBy: Schema.Literals(['Prize', 'Submissions']),
  context: Schema.Literals(['home', 'all']),
});
export type HackathonListQuery = typeof HackathonListQuery.Type;

export const DEFAULT_LIST_QUERY: HackathonListQuery = {
  order: 'desc',
  name: 'All',
  status: 'open',
  sortBy: 'Prize',
  context: 'all',
};

// Who's looking, as far as the list's region rule cares.
export interface RegionViewer {
  readonly isTalentFilled: boolean;
  readonly location: string | null;
}

// A hackathon's tracks, as /api/hackathon/[slug] lists them.
export interface Track {
  readonly title: string;
  readonly token: string | null;
  readonly rewardAmount: number | null;
  readonly slug: string;
  readonly sponsor: {
    readonly name: string;
    readonly slug: string;
    readonly logo: string | null;
    readonly isVerified: boolean;
    readonly chapter: { readonly id: string } | null;
  };
}

// /api/hackathon/public-stats.
export interface PublicStats {
  readonly totalRewardAmount: number;
  readonly totalListings: number;
  readonly deadline: string;
  readonly startDate: string;
  readonly announceDate: string;
}

export const LISTING_CARD = {
  id: true,
  rewardAmount: true,
  deadline: true,
  type: true,
  title: true,
  token: true,
  winnersAnnouncedAt: true,
  slug: true,
  isWinnersAnnounced: true,
  isFeatured: true,
  compensationType: true,
  minRewardAsk: true,
  maxRewardAsk: true,
  status: true,
  _count: {
    select: {
      Comments: {
        where: {
          isActive: true,
          isArchived: false,
          replyToId: null,
          type: { not: 'SUBMISSION' as const },
        },
      },
      Submission: true,
    },
  },
  sponsor: {
    select: {
      name: true,
      slug: true,
      logo: true,
      isVerified: true,
      chapter: { select: { id: true } },
    },
  },
} as const;

const OPEN_LISTING = {
  isActive: true,
  isArchived: false,
  status: 'OPEN' as const,
  isPublished: true,
};

// Earn's buildHackathonQuery: published public hackathon tracks of the
// named hackathons, in the viewer's regions when they have a profile.
export function hackathonListQuery(
  query: HackathonListQuery,
  regions: ReadonlyArray<string> | null,
  now: Date,
): {
  where: BountiesWhereInput;
  orderBy: BountiesOrderByWithRelationInput;
  take: number | undefined;
} {
  const where: BountiesWhereInput = {
    isPublished: true,
    isActive: true,
    isArchived: false,
    isPrivate: false,
    type: 'hackathon',
  };
  const named = HACKATHON_NAMES.filter((name) => name !== 'All');
  where.Hackathon =
    query.name === 'All' ? { name: { in: [...named] } } : { name: query.name };

  const and: BountiesWhereInput[] = [];
  if (query.context === 'home') {
    and.push({
      language: { in: ['eng', 'sco'] },
      OR: [
        { compensationType: 'fixed', usdValue: { gt: 100 } },
        { compensationType: 'range', maxRewardAsk: { gt: 100 } },
        { compensationType: 'variable' },
      ],
    });
  }
  if (regions) where.region = { in: [...regions] };
  switch (query.status) {
    case 'open':
      and.push({
        isWinnersAnnounced: false,
        OR: [{ deadline: null }, { deadline: { gte: now } }],
      });
      break;
    case 'review':
      and.push({ isWinnersAnnounced: false, deadline: { lt: now } });
      break;
    case 'completed':
      and.push({ isWinnersAnnounced: true });
      break;
  }
  if (and.length > 0) where.AND = and;

  const orderBy: BountiesOrderByWithRelationInput =
    query.sortBy === 'Prize'
      ? { usdValue: { sort: query.order, nulls: 'last' } }
      : { Submission: { _count: query.order } };

  return {
    where,
    orderBy,
    take: query.context === 'home' ? 10 : undefined,
  };
}

export interface SubscriptionRow {
  readonly id: string;
  readonly userId: string;
}

export class Hackathons extends Context.Service<
  Hackathons,
  {
    // A hackathon page's own record (with its sponsor).
    readonly bySlug: (
      slug: string,
    ) => Effect.Effect<
      Option.Option<HackathonWithSponsor>,
      Database.DatabaseError
    >;
    readonly tracks: (
      slug: string,
    ) => Effect.Effect<ReadonlyArray<Track>, Database.DatabaseError>;
    readonly publicStats: (
      slug: string,
    ) => Effect.Effect<PublicStats, HackathonNotFound | Database.DatabaseError>;
    // The region rule's view of a signed-in person.
    readonly regionViewer: (
      privyDid: string,
    ) => Effect.Effect<Option.Option<RegionViewer>, Database.DatabaseError>;
    readonly list: (
      query: HackathonListQuery,
      viewer: RegionViewer | null,
    ) => Effect.Effect<ReadonlyArray<ListingCardData>, Database.DatabaseError>;
    // The dashboard's hackathon picker (/api/hackathon/list).
    readonly options: (input: {
      readonly userId: string;
      readonly searchString: string | undefined;
      readonly take: number;
    }) => Effect.Effect<ReadonlyArray<unknown>, Database.DatabaseError>;
    // A hackathon sponsor's tracks (/api/hackathon/listings).
    readonly sponsorListings: (input: {
      readonly hackathonId: string | null;
      readonly searchText: string | undefined;
      readonly skip: number;
      readonly take: number;
    }) => Effect.Effect<unknown, HackathonNotFound | Database.DatabaseError>;
    // The dashboard's hackathon stats (/api/hackathon/stats).
    readonly sponsorStats: (input: {
      readonly userId: string;
      readonly slug: string | undefined;
    }) => Effect.Effect<unknown, HackathonNotFound | Database.DatabaseError>;
    readonly subscriptions: (
      slug: string,
    ) => Effect.Effect<
      ReadonlyArray<SubscriptionRow>,
      HackathonNotFound | Database.DatabaseError
    >;
    // Subscribes them, or flips an existing subscription on or off.
    readonly toggleSubscription: (
      userId: string,
      slug: string,
    ) => Effect.Effect<unknown, HackathonNotFound | Database.DatabaseError>;
    // Talent Olympics' leaderboards: submissions per country (padded with
    // chapter countries to ten) and the profiles behind ranked emails.
    readonly talentOlympics: (emails: ReadonlyArray<string>) => Effect.Effect<
      {
        readonly countryLeaders: ReadonlyArray<CountryLeader>;
        readonly profiles: ReadonlyArray<OlympicsProfile>;
      },
      Database.DatabaseError
    >;
  }
>()('earn/Hackathons') {}

export interface CountryLeader {
  readonly location: string;
  readonly submission_count: number;
}

export interface OlympicsProfile {
  readonly id: string;
  readonly username: string | null;
  readonly firstName: string | null;
  readonly lastName: string | null;
  readonly photo: string | null;
  readonly email: string;
}

export type HackathonWithSponsor = HackathonGetPayload<{
  include: { Sponsor: true };
}>;

const iso = (date: Date | null) => (date ? date.toISOString() : '');

const make = Effect.gen(function* () {
  const database = yield* Database.Database;
  const chapters = yield* HomeChapters.HomeChapters;

  const hackathonBySlug = (slug: string) =>
    database
      .query('hackathonBySlug', (client) =>
        client.hackathon.findUnique({ where: { slug } }),
      )
      .pipe(
        Effect.filterOrFail(
          (row) => row !== null,
          () => new HackathonNotFound(),
        ),
      );

  const bySlug = (slug: string) =>
    database
      .query('hackathonPage', (client) =>
        client.hackathon.findUnique({
          where: { slug },
          include: { Sponsor: true },
        }),
      )
      .pipe(Effect.map(Option.fromNullishOr));

  const tracks = (slug: string) =>
    database.query('hackathonTracks', (client) =>
      client.bounties.findMany({
        where: { Hackathon: { slug }, isPublished: true },
        select: {
          title: true,
          token: true,
          rewardAmount: true,
          slug: true,
          sponsor: {
            select: {
              name: true,
              slug: true,
              logo: true,
              isVerified: true,
              chapter: { select: { id: true } },
            },
          },
        },
        orderBy: { usdValue: 'desc' },
      }),
    );

  const publicStats = Effect.fn('Hackathons.publicStats')(function* (
    slug: string,
  ) {
    const hackathon = yield* hackathonBySlug(slug);
    const where = { hackathonId: hackathon.id, ...OPEN_LISTING };
    const [totalListings, reward] = yield* Effect.all(
      [
        database.query('hackathonListingCount', (client) =>
          client.bounties.count({ where }),
        ),
        database.query('hackathonReward', (client) =>
          client.bounties.aggregate({ _sum: { usdValue: true }, where }),
        ),
      ],
      { concurrency: 'unbounded' },
    );
    return {
      totalRewardAmount: reward._sum.usdValue || 0,
      totalListings,
      deadline: iso(hackathon.deadline),
      startDate: iso(hackathon.startDate),
      announceDate: iso(hackathon.announceDate),
    } satisfies PublicStats;
  });

  const regionViewer = (privyDid: string) =>
    database
      .query('hackathonViewer', (client) =>
        client.user.findUnique({
          where: { privyDid },
          select: { isTalentFilled: true, location: true },
        }),
      )
      .pipe(Effect.map(Option.fromNullishOr));

  const list = Effect.fn('Hackathons.list')(function* (
    query: HackathonListQuery,
    viewer: RegionViewer | null,
  ) {
    const regions = viewer?.isTalentFilled
      ? viewer.location
        ? combinedRegionsFor(yield* chapters.all, viewer.location)
        : ['Global']
      : null;
    const now = new Date(yield* Clock.currentTimeMillis);
    const { where, orderBy, take } = hackathonListQuery(query, regions, now);
    return yield* database.query('hackathonList', (client) =>
      client.bounties.findMany({ where, orderBy, take, select: LISTING_CARD }),
    );
  });

  const options = Effect.fn('Hackathons.options')(function* (input: {
    readonly userId: string;
    readonly searchString: string | undefined;
    readonly take: number;
  }) {
    const user = yield* database.query('hackathonOptionsUser', (client) =>
      client.user.findUnique({
        where: { id: input.userId },
        select: { id: true, role: true },
      }),
    );
    const where = input.searchString
      ? { name: { contains: input.searchString } }
      : {};
    if (user?.role === 'GOD') {
      const rows = yield* database.query('hackathonOptionsGod', (client) =>
        client.hackathon.findMany({
          where,
          take: input.take,
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            altLogo: true,
          },
          orderBy: { slug: 'asc' },
        }),
      );
      return rows.map((hackathon) => ({
        value: hackathon.id,
        label: hackathon.name,
        hackathon: { ...hackathon, role: 'GOD MODE' },
      }));
    }
    const rows = yield* database.query('hackathonOptions', (client) =>
      client.hackathon.findMany({
        where,
        orderBy: { announceDate: 'desc' },
        take: input.take,
      }),
    );
    return rows.map((hackathon) => ({
      value: hackathon.id,
      label: hackathon.name,
      hackathon: { ...hackathon, role: 'GOD MODE' },
    }));
  });

  const sponsorListings = Effect.fn('Hackathons.sponsorListings')(
    function* (input: {
      readonly hackathonId: string | null;
      readonly searchText: string | undefined;
      readonly skip: number;
      readonly take: number;
    }) {
      const hackathonId = input.hackathonId;
      const hackathon = hackathonId
        ? yield* database.query('sponsorHackathon', (client) =>
            client.hackathon.findUnique({ where: { id: hackathonId } }),
          )
        : null;
      if (!hackathon) return yield* new HackathonNotFound();
      const where = {
        ...OPEN_LISTING,
        hackathonId: hackathon.id,
        ...(input.searchText ? { title: { contains: input.searchText } } : {}),
      };
      const [total, rows] = yield* Effect.all(
        [
          database.query('sponsorHackathonCount', (client) =>
            client.bounties.count({ where }),
          ),
          database.query('sponsorHackathonListings', (client) =>
            client.bounties.findMany({
              where,
              skip: input.skip,
              take: input.take,
              orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
              select: {
                id: true,
                title: true,
                type: true,
                slug: true,
                token: true,
                status: true,
                deadline: true,
                isPublished: true,
                rewards: true,
                rewardAmount: true,
                isWinnersAnnounced: true,
                sponsor: {
                  select: {
                    name: true,
                    logo: true,
                    isVerified: true,
                    chapter: { select: { id: true } },
                  },
                },
                Hackathon: { select: { slug: true } },
                Submission: {
                  where: {
                    OR: [
                      { isActive: true, isArchived: false },
                      { isPaid: true },
                    ],
                  },
                  select: { isActive: true, isArchived: true, isPaid: true },
                },
              },
            }),
          ),
        ],
        { concurrency: 'unbounded' },
      );
      const listings = rows.map(({ Submission, ...bounty }) => ({
        ...bounty,
        _count: {
          Submission: Submission.filter(
            (sub) => sub.isActive && !sub.isArchived,
          ).length,
        },
        totalPaymentsMade: Submission.filter((sub) => sub.isPaid).length,
      }));
      return { total, startDate: hackathon.startDate, listings };
    },
  );

  const sponsorStats = Effect.fn('Hackathons.sponsorStats')(function* (input: {
    readonly userId: string;
    readonly slug: string | undefined;
  }) {
    const user = yield* database.query('hackathonStatsUser', (client) =>
      client.user.findUnique({
        where: { id: input.userId },
        select: { hackathonId: true },
      }),
    );
    const userHackathonId = user?.hackathonId;
    const slug = input.slug;
    const hackathon = userHackathonId
      ? yield* database.query('hackathonStatsById', (client) =>
          client.hackathon.findUnique({ where: { id: userHackathonId } }),
        )
      : slug
        ? yield* database.query('hackathonStatsBySlug', (client) =>
            client.hackathon.findUnique({ where: { slug } }),
          )
        : null;
    if (!hackathon) return yield* new HackathonNotFound();
    const listingWhere = { hackathonId: hackathon.id, ...OPEN_LISTING };
    const [totalListings, totalSubmissions, reward] = yield* Effect.all(
      [
        database.query('hackathonStatsListings', (client) =>
          client.bounties.count({ where: listingWhere }),
        ),
        database.query('hackathonStatsSubmissions', (client) =>
          client.submission.count({
            where: {
              listing: {
                hackathonId: hackathon.id,
                isActive: true,
                isArchived: false,
                status: 'OPEN',
              },
            },
          }),
        ),
        database.query('hackathonStatsReward', (client) =>
          client.bounties.aggregate({
            _sum: { usdValue: true },
            where: listingWhere,
          }),
        ),
      ],
      { concurrency: 'unbounded' },
    );
    return {
      name: hackathon.name,
      logo: hackathon.altLogo,
      totalRewardAmount: reward._sum.usdValue || 0,
      totalListings,
      totalSubmissions,
    };
  });

  const subscriptions = Effect.fn('Hackathons.subscriptions')(function* (
    slug: string,
  ) {
    const hackathon = yield* hackathonBySlug(slug);
    return yield* database.query('hackathonSubscriptions', (client) =>
      client.subscribeHackathon.findMany({
        where: { hackathonId: hackathon.id, isArchived: false },
        select: { id: true, userId: true },
      }),
    );
  });

  const toggleSubscription = Effect.fn('Hackathons.toggleSubscription')(
    function* (userId: string, slug: string) {
      const hackathon = yield* hackathonBySlug(slug);
      return yield* database.query(
        'toggleHackathonSubscription',
        async (client) => {
          const found = await client.subscribeHackathon.findFirst({
            where: { hackathonId: hackathon.id, userId },
          });
          return found
            ? client.subscribeHackathon.update({
                where: { id: found.id },
                data: { isArchived: !found.isArchived },
              })
            : client.subscribeHackathon.create({
                data: { hackathonId: hackathon.id, userId },
              });
        },
      );
    },
  );

  const talentOlympics = Effect.fn('Hackathons.talentOlympics')(function* (
    emails: ReadonlyArray<string>,
  ) {
    const leaders = yield* database.query(
      'olympicsCountryLeaders',
      (client) =>
        client.$queryRaw<
          { location: string; submission_count: bigint | number }[]
        >`
SELECT
    u.location,
    COUNT(s.id) as submission_count
FROM
    Hackathon h
JOIN
    Bounties b ON h.id = b.hackathonId
JOIN
    Submission s ON b.id = s.listingId
JOIN
    User u ON s.userId = u.id
WHERE
    h.slug = ${'talent-olympics'}
GROUP BY
    u.location
ORDER BY
    submission_count DESC
LIMIT 10;
`,
    );
    const countryLeaders: CountryLeader[] = leaders.map((leader) => ({
      location: leader.location,
      submission_count: Number(leader.submission_count),
    }));
    if (countryLeaders.length < 10) {
      const all = yield* chapters.all;
      const locations = all
        .flatMap((chapter) =>
          chapter.country.length ? [...chapter.country] : [chapter.region],
        )
        .filter((location) => Boolean(location?.trim()))
        .filter(
          (location, index, arr) =>
            arr.findIndex(
              (item) => item.toLowerCase() === location.toLowerCase(),
            ) === index,
        );
      const count = countryLeaders.length;
      const rest = locations
        .filter(
          (location) =>
            count === 0 ||
            !countryLeaders.some(
              (leader) =>
                leader.location.toLowerCase() === location.toLowerCase(),
            ),
        )
        .slice(0, 10 - count);
      for (let i = 0; i < 10 - count; i++) {
        countryLeaders.push({ location: rest[i] ?? 'na', submission_count: 0 });
      }
    }
    const profiles = yield* database.query('olympicsProfiles', (client) =>
      client.user.findMany({
        where: { email: { in: [...emails] } },
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          photo: true,
          email: true,
        },
      }),
    );
    return { countryLeaders, profiles };
  });

  return Hackathons.of({
    bySlug,
    tracks,
    publicStats,
    regionViewer,
    list,
    options,
    sponsorListings,
    sponsorStats,
    subscriptions,
    toggleSubscription,
    talentOlympics,
  });
});

export const layer = Layer.effect(Hackathons, make);
