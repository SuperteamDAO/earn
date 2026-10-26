import 'server-only';

import * as Clock from 'effect/Clock';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Schema from 'effect/Schema';
import Papa from 'papaparse';

import { Prisma } from '@/prisma/client';
import * as Database from '@/server/database';

// A talent profile in the sponsor's chapter region, ranked by earnings.
export interface LocalProfile {
  readonly id: string;
  readonly photo: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly username: string;
  readonly email: string;
  readonly bio: string;
  readonly totalEarnings: number;
  readonly totalSubmissions: number;
  readonly rank: number;
  readonly wins: number;
  readonly skills: ReadonlyArray<{
    readonly skills: string;
    readonly subskills: ReadonlyArray<string>;
  }>;
  readonly twitter: string;
  readonly telegram: string;
  readonly discord: string;
  readonly website: string;
  readonly community: string;
  readonly interests: string;
  readonly createdAt: string;
}

export interface Chapter {
  readonly id: string;
  readonly region: string;
  readonly countries: ReadonlyArray<string>;
}

export class NoChapter extends Schema.TaggedError<NoChapter>()(
  'NoChapter',
  {},
) {
  override get message() {
    return 'Sponsor chapter not configured';
  }
}

// Only God mode and the chapter's core members see its talent.
export class NotChapterCore extends Schema.TaggedError<NotChapterCore>()(
  'NotChapterCore',
  {},
) {
  override get message() {
    return 'Unauthorized';
  }
}

export class LocalProfiles extends Context.Service<
  LocalProfiles,
  {
    readonly list: (
      userId: string,
    ) => Effect.Effect<
      ReadonlyArray<LocalProfile>,
      NoChapter | NotChapterCore | Database.DatabaseError
    >;
    // The CSV Earn exported: its file name and contents.
    readonly exportCsv: (
      userId: string,
    ) => Effect.Effect<
      { readonly fileName: string; readonly csv: string },
      NoChapter | NotChapterCore | Database.DatabaseError
    >;
  }
>()('earn/LocalProfiles') {}

const text = (value: unknown) =>
  typeof value === 'string'
    ? value
    : typeof value === 'number' || typeof value === 'bigint'
      ? String(value)
      : '';

const skillsOf = (value: unknown): LocalProfile['skills'] => {
  const parsed: unknown =
    typeof value === 'string'
      ? (() => {
          try {
            return JSON.parse(value);
          } catch {
            return [];
          }
        })()
      : value;
  if (!Array.isArray(parsed)) return [];
  return parsed.flatMap((item: unknown) => {
    if (!item || typeof item !== 'object' || !('skills' in item)) return [];
    const subskills =
      'subskills' in item && Array.isArray(item.subskills)
        ? item.subskills.filter((s): s is string => typeof s === 'string')
        : [];
    return typeof item.skills === 'string'
      ? [{ skills: item.skills, subskills }]
      : [];
  });
};

const listOf = (value: string | null | undefined): Array<string> => {
  try {
    const parsed: unknown = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed.map(text) : [];
  } catch {
    return [];
  }
};

// Who Earn's listing page and export treat as the chapter's: anyone whose
// location is one of its countries (its region, without any).
export const countriesOf = (chapter: {
  readonly region: string;
  readonly countries: Prisma.JsonValue;
}): Array<string> => {
  const countries = Array.isArray(chapter.countries)
    ? chapter.countries.filter((c): c is string => typeof c === 'string')
    : [];
  return countries.length ? countries : [chapter.region];
};

const make = Effect.gen(function* () {
  const database = yield* Database.Database;

  const chapterFor = Effect.fn('LocalProfiles.chapterFor')(function* (
    userId: string,
  ) {
    const user = yield* database.query('localProfilesViewer', (client) =>
      client.user.findUnique({
        where: { id: userId },
        select: {
          role: true,
          people: { select: { chapterId: true, type: true } },
          currentSponsor: {
            select: {
              chapter: {
                select: { id: true, region: true, countries: true },
              },
            },
          },
        },
      }),
    );
    const chapter = user?.currentSponsor?.chapter;
    if (!chapter) return yield* new NoChapter();
    const isCore =
      user.people?.type?.toUpperCase() === 'CORE' &&
      user.people.chapterId === chapter.id;
    if (user.role !== 'GOD' && !isCore) return yield* new NotChapterCore();
    return chapter;
  });

  const list = Effect.fn('LocalProfiles.list')(function* (userId: string) {
    const chapter = yield* chapterFor(userId);
    const countries = countriesOf(chapter);
    const rows = yield* database.query(
      'localProfiles',
      (client) =>
        client.$queryRaw<Array<Record<string, unknown>>>`
      WITH user_stats AS (
        SELECT
          u.id,
          u.firstName,
          u.lastName,
          u.email,
          u.skills,
          u.telegram,
          u.twitter,
          u.website,
          u.discord,
          u.username,
          u.photo,
          u.bio,
          u.community,
          u.interests,
          u.createdAt,
          COALESCE(submission_stats.total_submissions, 0) as totalSubmissions,
          COALESCE(submission_stats.wins, 0) as wins,
          COALESCE(submission_stats.listing_winnings, 0) + COALESCE(grant_stats.grant_winnings, 0) as totalEarnings
        FROM User u
        LEFT JOIN (
          SELECT
            s.userId,
            COUNT(*) as total_submissions,
            COUNT(CASE WHEN s.isWinner = true AND l.isWinnersAnnounced = true THEN 1 END) as wins,
            COALESCE(SUM(CASE WHEN s.isWinner = true AND l.isWinnersAnnounced = true THEN s.rewardInUSD ELSE 0 END), 0) as listing_winnings
          FROM Submission s
          INNER JOIN Bounties l ON s.listingId = l.id
          GROUP BY s.userId
        ) submission_stats ON u.id = submission_stats.userId
        LEFT JOIN (
          SELECT
            ga.userId,
            COALESCE(SUM(CASE WHEN ga.applicationStatus = 'Approved' THEN ga.approvedAmountInUSD ELSE 0 END), 0) as grant_winnings
          FROM GrantApplication ga
          GROUP BY ga.userId
        ) grant_stats ON u.id = grant_stats.userId
        WHERE u.location IN (${Prisma.join(countries)})
      )
      SELECT
        *,
        ROW_NUMBER() OVER (ORDER BY totalEarnings DESC, wins DESC, totalSubmissions DESC) as \`rank\`
      FROM user_stats
      ORDER BY totalEarnings DESC, wins DESC, totalSubmissions DESC
    `,
    );
    return rows.map((row): LocalProfile => ({
      id: text(row.id),
      photo: text(row.photo),
      firstName: text(row.firstName),
      lastName: text(row.lastName),
      username: text(row.username),
      email: text(row.email),
      bio: text(row.bio),
      totalEarnings: Number(row.totalEarnings ?? 0),
      totalSubmissions: Number(row.totalSubmissions ?? 0),
      rank: Number(row.rank ?? 0),
      wins: Number(row.wins ?? 0),
      skills: skillsOf(row.skills),
      twitter: text(row.twitter),
      telegram: text(row.telegram),
      discord: text(row.discord),
      website: text(row.website),
      community: text(row.community),
      interests: text(row.interests),
      createdAt:
        row.createdAt instanceof Date
          ? row.createdAt.toISOString()
          : text(row.createdAt),
    }));
  });

  // Earn's export: ranked by earnings alone, in batches of 10,000.
  const exportCsv = Effect.fn('LocalProfiles.exportCsv')(function* (
    userId: string,
  ) {
    const chapter = yield* chapterFor(userId);
    const countries = countriesOf(chapter);
    const talent = yield* database.query(
      'localProfilesExport',
      async (client) => {
        const select = {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          skills: true,
          username: true,
          bio: true,
          community: true,
          interests: true,
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
        } satisfies Prisma.UserSelect;
        const all: Array<Prisma.UserGetPayload<{ select: typeof select }>> = [];
        let cursor: string | undefined;
        for (;;) {
          const batch = await client.user.findMany({
            where: { location: { in: countries } },
            select,
            take: 10_000,
            ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
            orderBy: { id: 'asc' },
          });
          all.push(...batch);
          const last = batch.at(-1);
          if (batch.length < 10_000 || !last) break;
          cursor = last.id;
        }
        return all;
      },
    );

    const ranked = talent
      .map((user) => {
        const won = user.Submission.filter(
          (s) => s.isWinner && s.listing.isWinnersAnnounced,
        );
        const listingWinnings = won.reduce(
          (sum, s) => sum + (s.rewardInUSD || 0),
          0,
        );
        const grantWinnings = user.GrantApplication.filter(
          (g) => g.applicationStatus === 'Approved',
        ).reduce((sum, g) => sum + (g.approvedAmountInUSD || 0), 0);
        return {
          user,
          wins: won.length,
          totalSubmissions: user.Submission.length,
          totalEarnings: listingWinnings + grantWinnings,
        };
      })
      .toSorted((a, b) => b.totalEarnings - a.totalEarnings);

    const rows = ranked.map(
      ({ user, wins, totalSubmissions, totalEarnings }, index) => {
        const skills = skillsOf(user.skills);
        const parentSkills = skills.map((skill) => skill.skills);
        const subSkills = skills.flatMap((skill) => skill.subskills);
        const communities = listOf(user.community);
        const interests = listOf(user.interests);
        return {
          Rank: index + 1,
          Name: `${user.firstName} ${user.lastName}`,
          'Email ID': user.email,
          'Profile Link': `https://superteam.fun/earn/t/${user.username}`,
          Wins: wins,
          Submissions: totalSubmissions,
          'Total Earnings': `$${totalEarnings.toLocaleString('en-us', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`,
          Bio: user.bio,
          Skills: parentSkills.length > 0 ? parentSkills.join(', ') : '-',
          Subkills: subSkills.length > 0 ? subSkills.join(', ') : '-',
          Interests: interests.length > 0 ? interests.join(', ') : '-',
          Communities: communities.length > 0 ? communities.join(', ') : '-',
        };
      },
    );
    const now = yield* Clock.currentTimeMillis;
    return {
      fileName: `${chapter.region}-local-profiles-${now}`,
      csv: Papa.unparse(rows),
    };
  });

  return LocalProfiles.of({ list, exportCsv });
});

export const layer = Layer.effect(LocalProfiles, make);
