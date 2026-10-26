import 'server-only';

import * as Clock from 'effect/Clock';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import * as Database from '@/server/database';

const TALENT = {
  id: true,
  twitter: true,
  linkedin: true,
  github: true,
  website: true,
  username: true,
  workPrefernce: true,
  firstName: true,
  lastName: true,
  skills: true,
  photo: true,
  currentEmployer: true,
  location: true,
  private: true,
} as const;

export interface TalentPage {
  readonly talent: {
    readonly id: string;
    readonly twitter: string | null;
    readonly linkedin: string | null;
    readonly github: string | null;
    readonly website: string | null;
    readonly username: string | null;
    readonly workPrefernce: string | null;
    readonly firstName: string | null;
    readonly lastName: string | null;
    readonly skills: unknown;
    readonly photo: string | null;
    readonly currentEmployer: string | null;
    readonly location: string | null;
    readonly private: boolean;
  };
  readonly stats: {
    readonly wins: number;
    readonly participations: number;
    readonly totalWinnings: number;
  };
  // Which of Earn's five header backgrounds, fixed per person.
  readonly bgIndex: number;
  // Nothing won and nothing entered lately: kept out of search engines.
  readonly shouldNoIndex: boolean;
}

export interface Project {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly link: string;
  readonly skills: unknown;
  readonly subSkills: unknown;
  readonly createdAt: string;
}

interface SubmissionStats {
  participations: bigint | number;
  wins: bigint | number | null;
  listingWinnings: number | null;
}

interface GrantStats {
  grantWinnings: number | null;
}

const hashStringToInt = (input: string): number => {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const THREE_MONTHS_MS = 92 * 24 * 60 * 60 * 1000;

export class TalentProfile extends Context.Service<
  TalentProfile,
  {
    // A talent's public profile (Earn's /earn/t/[slug]); null when there's
    // no such username.
    readonly byUsername: (
      username: string,
    ) => Effect.Effect<TalentPage | null, Database.DatabaseError>;
    // Their proof of work, as the edit form lists it (Earn's /api/pow/get).
    readonly projects: (
      userId: string,
    ) => Effect.Effect<ReadonlyArray<Project>, Database.DatabaseError>;
  }
>()('earn/TalentProfile') {}

const make = Effect.gen(function* () {
  const database = yield* Database.Database;

  const byUsername = Effect.fn('TalentProfile.byUsername')(function* (
    username: string,
  ) {
    const [talent, submissionStats, grantStats] = yield* Effect.all(
      [
        database.query('talentByUsername', (client) =>
          client.user.findUnique({ where: { username }, select: TALENT }),
        ),
        database.query(
          'talentSubmissionStats',
          (client) => client.$queryRaw<SubmissionStats[]>`
            SELECT
              COUNT(*) as participations,
              SUM(CASE WHEN s.isWinner = 1 AND b.isWinnersAnnounced = 1 THEN 1 ELSE 0 END) as wins,
              COALESCE(SUM(CASE WHEN s.isWinner = 1 AND b.isWinnersAnnounced = 1 THEN s.rewardInUSD ELSE 0 END), 0) as listingWinnings
            FROM Submission s
            LEFT JOIN Bounties b ON s.listingId = b.id
            INNER JOIN User u ON u.username = ${username}
            WHERE s.userId = u.id
          `,
        ),
        database.query(
          'talentGrantStats',
          (client) => client.$queryRaw<GrantStats[]>`
            SELECT COALESCE(SUM(ga.approvedAmountInUSD), 0) as grantWinnings
            FROM GrantApplication ga
            INNER JOIN User u ON ga.userId = u.id
            WHERE u.username = ${username}
              AND ga.applicationStatus IN ('Approved', 'Completed')
          `,
        ),
      ],
      { concurrency: 'unbounded' },
    );
    if (!talent) return null;

    const sub = submissionStats[0];
    const participations = Number(sub?.participations ?? 0);
    const wins = Number(sub?.wins ?? 0);
    const totalWinnings =
      (sub?.listingWinnings ?? 0) + (grantStats[0]?.grantWinnings ?? 0);

    let hasRecentActivity = false;
    if (totalWinnings <= 0) {
      const since = new Date(
        (yield* Clock.currentTimeMillis) - THREE_MONTHS_MS,
      );
      const [submission, application] = yield* Effect.all(
        [
          database.query('recentSubmission', (client) =>
            client.submission.findFirst({
              where: { userId: talent.id, createdAt: { gte: since } },
              select: { id: true },
            }),
          ),
          database.query('recentGrantApplication', (client) =>
            client.grantApplication.findFirst({
              where: { userId: talent.id, createdAt: { gte: since } },
              select: { id: true },
            }),
          ),
        ],
        { concurrency: 'unbounded' },
      );
      hasRecentActivity = !!submission || !!application;
    }

    return {
      talent,
      stats: { participations, wins, totalWinnings },
      bgIndex: hashStringToInt(talent.id) % 5,
      shouldNoIndex: totalWinnings <= 0 && !hasRecentActivity,
    } satisfies TalentPage;
  });

  const projects = Effect.fn('TalentProfile.projects')(function* (
    userId: string,
  ) {
    const rows = yield* database.query('projects', (client) =>
      client.poW.findMany({
        where: { userId },
        select: {
          id: true,
          title: true,
          description: true,
          link: true,
          skills: true,
          subSkills: true,
          createdAt: true,
        },
      }),
    );
    return rows.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
    }));
  });

  return TalentProfile.of({ byUsername, projects });
});

export const layer = Layer.effect(TalentProfile, make);
