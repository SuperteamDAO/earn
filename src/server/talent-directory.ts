import 'server-only';

import * as Clock from 'effect/Clock';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Schema from 'effect/Schema';
import {
  adjectives,
  colors,
  type Config,
  NumberDictionary,
  uniqueNamesGenerator,
} from 'unique-names-generator';

import * as Database from '@/server/database';

export class SearchBlocked extends Schema.TaggedError<SearchBlocked>()(
  'SearchBlocked',
  {},
) {
  override get message() {
    return 'User is blocked';
  }
}

export interface PersonMatch {
  readonly id: string;
  readonly username: string | null;
  readonly photo: string | null;
  readonly firstName: string | null;
  readonly lastName: string | null;
}

// Earn's onboarding side panel: who else signed up and what's been earned.
export interface OnboardingStats {
  readonly totalUsers: number;
  readonly totalInUSD: number;
  readonly liveUsdValue: number;
  // The Superteam chapter for where they are, when there's one.
  readonly chapter: {
    readonly displayValue: string | null;
    readonly icons: string | null;
  } | null;
}

export class TalentDirectory extends Context.Service<
  TalentDirectory,
  {
    // Whether a username is free, or already theirs.
    readonly usernameAvailable: (
      username: string,
      userId: string,
    ) => Effect.Effect<boolean, Database.DatabaseError>;
    // A free username to suggest, from their first name (Earn's
    // generateUniqueRandomUsername); null after ten taken tries.
    readonly randomUsername: (
      firstName?: string | null,
    ) => Effect.Effect<string | null, Database.DatabaseError>;
    // People to @-mention, by username or name (Earn's /api/user/search).
    readonly search: (
      query: string,
      take: number,
      privyDid: string | null,
    ) => Effect.Effect<
      ReadonlyArray<PersonMatch>,
      SearchBlocked | Database.DatabaseError
    >;
    readonly photo: (
      id: string,
    ) => Effect.Effect<
      { readonly id: string; readonly photo: string | null } | null,
      Database.DatabaseError
    >;
    // Earn's "join N+ others" count, rounded as Earn rounds it.
    readonly userCount: Effect.Effect<number, Database.DatabaseError>;
    readonly onboardingStats: (
      countryCode: string | null,
    ) => Effect.Effect<OnboardingStats, Database.DatabaseError>;
    // Earn user ids for these Privy accounts, in their order; unknown ones
    // are left out.
    readonly userIdsFor: (
      privyDids: ReadonlyArray<string>,
    ) => Effect.Effect<ReadonlyArray<string>, Database.DatabaseError>;
    // Active chapters' names, for the edit form's communities.
    readonly chapterNames: Effect.Effect<
      ReadonlyArray<string>,
      Database.DatabaseError
    >;
  }
>()('earn/TalentDirectory') {}

const MAX_USERNAME_ATTEMPTS = 10;
// Accounts Earn's count leaves out.
const ERROR_COUNT = 289;

const make = Effect.gen(function* () {
  const database = yield* Database.Database;

  const usernameAvailable = Effect.fn('TalentDirectory.usernameAvailable')(
    function* (username: string, userId: string) {
      const owner = yield* database.query('usernameOwner', (client) =>
        client.user.findUnique({ where: { username }, select: { id: true } }),
      );
      return !owner || owner.id === userId;
    },
  );

  const randomUsername = Effect.fn('TalentDirectory.randomUsername')(function* (
    firstName?: string | null,
  ) {
    const numbers = NumberDictionary.generate({ min: 1, max: 99 });
    for (let attempt = 0; attempt < MAX_USERNAME_ATTEMPTS; attempt++) {
      const shuffled = [adjectives, colors]
        .toSorted(() => Math.random() - 0.5)
        .slice(0, firstName ? 1 : 2);
      const config: Config = {
        dictionaries: [...shuffled, numbers],
        separator: '-',
        length: firstName ? 2 : 3,
        style: 'lowerCase',
      };
      let username = uniqueNamesGenerator(config);
      if (firstName) username = `${firstName.toLowerCase()}-${username}`;
      username = username.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
      const taken = yield* database.query('usernameOwner', (client) =>
        client.user.findUnique({
          where: { username },
          select: { id: true },
        }),
      );
      if (!taken) return username;
    }
    return null;
  });

  const search = Effect.fn('TalentDirectory.search')(function* (
    query: string,
    take: number,
    privyDid: string | null,
  ) {
    if (privyDid) {
      const user = yield* database.query('searcher', (client) =>
        client.user.findUnique({
          where: { privyDid },
          select: { isBlocked: true },
        }),
      );
      if (user?.isBlocked) return yield* new SearchBlocked();
    }
    return yield* database.query('searchUsers', (client) =>
      client.user.findMany({
        where: {
          AND: [
            { username: { not: '' } },
            { username: { not: null } },
            {
              OR: [
                { username: { contains: query } },
                { firstName: { contains: query } },
                { lastName: { contains: query } },
              ],
            },
          ],
        },
        take,
        select: {
          id: true,
          username: true,
          photo: true,
          firstName: true,
          lastName: true,
        },
      }),
    );
  });

  const photo = (id: string) =>
    database.query('userPhoto', (client) =>
      client.user.findUnique({
        where: { id },
        select: { id: true, photo: true },
      }),
    );

  const userCount = database
    .query('userCount', (client) => client.user.count())
    .pipe(Effect.map((count) => Math.ceil((count - ERROR_COUNT) / 10) * 10));

  const onboardingStats = Effect.fn('TalentDirectory.onboardingStats')(
    function* (countryCode: string | null) {
      const code = countryCode?.trim().toLowerCase() || null;
      const now = yield* Clock.currentTimeMillis;
      const [totalUsers, listings, grants, live, chapters] = yield* Effect.all(
        [
          userCount,
          database.query('earnedListings', (client) =>
            client.bounties.aggregate({
              _sum: { usdValue: true },
              where: {
                isWinnersAnnounced: true,
                isPublished: true,
                status: 'OPEN',
              },
            }),
          ),
          database.query('earnedGrants', (client) =>
            client.grantApplication.aggregate({
              _sum: { approvedAmountInUSD: true },
              where: {
                OR: [
                  { applicationStatus: 'Approved' },
                  { applicationStatus: 'Completed' },
                ],
              },
            }),
          ),
          database.query('liveOpportunities', (client) =>
            client.bounties.aggregate({
              where: {
                status: 'OPEN',
                isPublished: true,
                isArchived: false,
                isPrivate: false,
                isActive: true,
                isWinnersAnnounced: false,
                deadline: { gt: new Date(now) },
              },
              _sum: { usdValue: true },
            }),
          ),
          code
            ? database.query('chapters', (client) =>
                client.chapter.findMany({
                  where: { active: true },
                  select: { code: true, displayValue: true, icons: true },
                }),
              )
            : Effect.succeed([]),
        ],
        { concurrency: 'unbounded' },
      );
      const chapter =
        chapters.find((row) => row.code?.trim().toLowerCase() === code) ?? null;
      return {
        totalUsers,
        totalInUSD:
          Math.ceil(
            ((listings._sum.usdValue ?? 0) +
              (grants._sum.approvedAmountInUSD ?? 0)) /
              10,
          ) * 10,
        liveUsdValue: Math.round(live._sum.usdValue ?? 0),
        chapter: chapter
          ? { displayValue: chapter.displayValue, icons: chapter.icons }
          : null,
      } satisfies OnboardingStats;
    },
  );

  const userIdsFor = Effect.fn('TalentDirectory.userIdsFor')(function* (
    privyDids: ReadonlyArray<string>,
  ) {
    const users = yield* database.query('usersByPrivyDid', (client) =>
      client.user.findMany({
        where: { privyDid: { in: [...privyDids] } },
        select: { id: true, privyDid: true },
      }),
    );
    const ids = new Map(users.map((user) => [user.privyDid, user.id]));
    return privyDids.flatMap((did) => ids.get(did) ?? []);
  });

  const chapterNames = database
    .query('chapterNames', (client) =>
      client.chapter.findMany({
        where: { active: true },
        select: { name: true },
        orderBy: { name: 'asc' },
      }),
    )
    .pipe(Effect.map((rows) => rows.map((row) => row.name)));

  return TalentDirectory.of({
    usernameAvailable,
    randomUsername,
    search,
    photo,
    userCount,
    onboardingStats,
    userIdsFor,
    chapterNames,
  });
});

export const layer = Layer.effect(TalentDirectory, make);
