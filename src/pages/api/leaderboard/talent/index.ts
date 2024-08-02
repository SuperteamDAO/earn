import { verifySignature } from '@upstash/qstash/nextjs';
import { type NextApiRequest, type NextApiResponse } from 'next';

import {
  firstDayOfYear,
  lastSevenDays,
  lastThirtyDays,
  type SKILL,
  skillCategories,
  type TIMEFRAME,
} from '@/features/leaderboard';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

interface RankingCriteria {
  dollarsEarnedWeight: number;
  winRateWeight: number;
}

function buildTalentLeaderboardQuery(
  rankingCriteria: RankingCriteria,
  skillFilter: SKILL,
  dateFilter?: {
    range: [string] | [string, string];
    label: string;
  },
): string {
  const { dollarsEarnedWeight, winRateWeight } = rankingCriteria;

  const baseQuery = `
    SELECT
      u.id AS userId,
      SUM(s.rewardInUSD) AS totalEarnedInUSD,
      COUNT(s.id) AS submissions,
      SUM(s.isWinner) AS wins,
      COALESCE(AVG(s.isWinner), 0) AS winRate,
      (SUM(s.rewardInUSD) * ${dollarsEarnedWeight} + COALESCE(AVG(s.isWinner), 0) * ${winRateWeight}) AS score
    FROM User u
    LEFT JOIN Submission s ON u.id = s.userId
    LEFT JOIN Bounties b ON s.listingId = b.id
  `;

  const skillCondition =
    skillFilter !== 'ALL'
      ? `AND (${skillCategories[skillFilter]
          .map(
            (skill) =>
              `JSON_CONTAINS(JSON_EXTRACT(b.skills, '$[*].skills'), JSON_QUOTE('${skill}'))`,
          )
          .join(' OR ')})`
      : '';

  const dateCondition = dateFilter
    ? dateFilter.range.length === 1
      ? `AND b.winnersAnnouncedAt >= '${dateFilter.range[0]}'`
      : `AND b.winnersAnnouncedAt BETWEEN '${dateFilter.range[0]}' AND '${dateFilter.range[1]}'`
    : '';

  const groupByClause = `
    GROUP BY u.id
  `;

  const rankingSubquery = `
    SELECT
      UUID() AS id,
      ROW_NUMBER() OVER (ORDER BY score DESC, submissions DESC) AS \`rank\`,
      submissions,
      wins,
      ROUND(winRate * 100) AS winRate,
      totalEarnedInUSD,
      userId,
      '${skillFilter}' AS skill,
      '${dateFilter ? dateFilter.label : 'ALL_TIME'}' AS timeframe
    FROM (
      ${baseQuery}
      WHERE 1=1
      AND s.isWinner = 1
      ${skillCondition}
      ${dateCondition}
      ${groupByClause}
      HAVING SUM(s.rewardInUSD) > 0
      ORDER BY u.createdAt ASC
    ) AS ranking
  `;

  const upsertQuery = `
    INSERT INTO TalentRankings (id, \`rank\`, submissions, wins, winRate, totalEarnedInUSD, userId, skill, timeframe)
    ${rankingSubquery}
    ON DUPLICATE KEY UPDATE
      \`rank\` = VALUES(\`rank\`),
      submissions = VALUES(submissions),
      wins = VALUES(wins),
      winRate = VALUES(winRate),
      totalEarnedInUSD = VALUES(totalEarnedInUSD),
      skill = VALUES(skill),
      timeframe = VALUES(timeframe)
  `;

  return upsertQuery;
}

// Example usage to create queries for each skill filter
const skillsFilter: SKILL[] = [
  'ALL',
  'DEVELOPMENT',
  'OTHER',
  'DESIGN',
  'CONTENT',
];

const timeframeFilters: [TIMEFRAME, [string, string] | [string]][] = [
  ['LAST_7_DAYS', lastSevenDays()],
  ['LAST_30_DAYS', lastThirtyDays()],
  ['THIS_YEAR', firstDayOfYear()],
];

const rankingCriteria: RankingCriteria = {
  dollarsEarnedWeight: 0.5,
  winRateWeight: 0.5,
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ message: 'Method Not Allowed' });
    return;
  }

  logger.debug(`Request body: ${safeStringify(req.body)}`);

  await prisma.$transaction(
    async (tsx) => {
      logger.debug('Deleting existing talent rankings');
      await tsx.talentRankings.deleteMany({});

      const allQueries: string[] = [];

      skillsFilter.forEach((skillFilter) => {
        allQueries.push(
          buildTalentLeaderboardQuery(rankingCriteria, skillFilter),
        );
      });

      timeframeFilters.forEach((timeframe) => {
        skillsFilter.forEach((skillFilter) => {
          allQueries.push(
            buildTalentLeaderboardQuery(rankingCriteria, skillFilter, {
              range: timeframe[1],
              label: timeframe[0],
            }),
          );
        });
      });

      try {
        for (let i = 0; i < allQueries.length; i++) {
          logger.debug(`Executing query ${i + 1}/${allQueries.length}`);
          await tsx.$executeRawUnsafe(allQueries[i]!);
        }
        logger.info('Talent rankings updated successfully');
        res.send('done');
      } catch (err: any) {
        logger.error(
          'Error occurred while updating talent rankings:',
          safeStringify(err),
        );
        res.send('fail');
      }
    },
    {
      timeout: 1000000,
      maxWait: 1000000,
    },
  );
}

export default verifySignature(handler);

export const config = {
  api: {
    bodyParser: false,
  },
};
