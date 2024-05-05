import { type NextApiRequest, type NextApiResponse } from 'next';

import {
  firstAndLastDayOfLastMonth,
  // firstAndLastDayOfLastQuarter,
  // firstDayOfYear
} from '@/features/leaderboard';
import { prisma } from '@/prisma';

type SKILL_FILTER = 'DEVELOPMENT' | 'DESIGN' | 'CONTENT' | 'OTHER' | 'ALL';

interface RankingCriteria {
  dollarsEarnedWeight: number;
  winRateWeight: number;
}

const skillCategories: Record<SKILL_FILTER, string[]> = {
  DEVELOPMENT: ['Frontend', 'Backend', 'Blockchain', 'Mobile'],
  DESIGN: ['Design'],
  CONTENT: ['Content'],
  OTHER: ['Other', 'Growth', 'Community'],
  ALL: [],
};

function buildTalentLeaderboardQuery(
  rankingCriteria: RankingCriteria,
  skillFilter: SKILL_FILTER,
  dateFilter?: {
    range: [string] | [string, string];
    label: string;
  },
): string {
  const { dollarsEarnedWeight, winRateWeight } = rankingCriteria;

  const baseQuery = `
    SELECT
      u.id AS userId,
      u.totalEarnedInUSD,
      COUNT(s.id) AS submissions,
      SUM(s.isWinner) AS wins,
      COALESCE(AVG(s.isWinner), 0) AS winRate,
      (u.totalEarnedInUSD * ${dollarsEarnedWeight} + COALESCE(AVG(s.isWinner), 0) * ${winRateWeight}) AS score
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
      ? `AND b.createdAt >= '${dateFilter.range[0]}'`
      : `AND b.createdAt BETWEEN '${dateFilter.range[0]}' AND '${dateFilter.range[1]}'`
    : '';

  const groupByClause = `
    GROUP BY u.id
  `;

  const rankingSubquery = `
    SELECT
      UUID() AS id,
      RANK() OVER (ORDER BY score DESC) AS \`rank\`,
submissions,
wins,
ROUND(winRate * 100) AS winRate,
userId,
'${skillFilter}' AS skill,
'${dateFilter ? dateFilter.label : 'ALL_TIME'}' AS timeframe
    FROM (
      ${baseQuery}
      WHERE 1=1
      ${skillCondition}
      ${dateCondition}
      ${groupByClause}
    ) AS ranking
  `;

  const upsertQuery = `
    INSERT INTO TalentRankings (id, \`rank\`, submissions, wins, winRate, userId, skill, timeframe)
    ${rankingSubquery}
    ON DUPLICATE KEY UPDATE
      \`rank\` = VALUES(\`rank\`),
      submissions = VALUES(submissions),
      wins = VALUES(wins),
      winRate = VALUES(winRate),
      skill = VALUES(skill),
      timeframe = VALUES(timeframe)
  `;

  return upsertQuery;
}

// Example usage to create queries for each skill filter
const skillsFilter: SKILL_FILTER[] = [
  'ALL',
  'DEVELOPMENT',
  'OTHER',
  'DESIGN',
  'CONTENT',
];

const rankingCriteria: RankingCriteria = {
  dollarsEarnedWeight: 0.5,
  winRateWeight: 0.5,
};

export default async function user(_: NextApiRequest, res: NextApiResponse) {
  // TODO: convert to only POST request later

  const allQueries = skillsFilter.map((skillFilter) => {
    return buildTalentLeaderboardQuery(rankingCriteria, skillFilter, {
      range: firstAndLastDayOfLastMonth(),
      label: 'LAST_MONTH',
    });
  });
  try {
    for (let i = 0; i < allQueries.length; i++) {
      // console.log(allQueries[i]);
      const result = await prisma.$executeRawUnsafe(allQueries[i]!);
      console.log('skill -', skillsFilter[i], ' done - ', result);
    }
    console.log('done');
    res.send('done');
  } catch (err) {
    console.log('Erorr', JSON.stringify(err, null, 2));
    res.send('fail');
  }
}

// function buildTalentLeaderboardQuerySelect(
//   rankingCriteria: RankingCriteria,
//   skillFilter: SKILL_FILTER,
//   dateFilter?: {
//     range: [string] | [string, string],
//     label: string
//   }
// ): string {
//   const { dollarsEarnedWeight, winRateWeight } = rankingCriteria;
//
//   const baseQuery = `
//     SELECT
//       u.id AS userId,
//       u.totalEarnedInUSD,
//       COALESCE(AVG(s.isWinner), 0) AS winRate,
//       (u.totalEarnedInUSD * ${dollarsEarnedWeight} + COALESCE(AVG(s.isWinner), 0) * ${winRateWeight}) AS score
//     FROM User u
//     LEFT JOIN Submission s ON u.id = s.userId
//     LEFT JOIN Bounties b ON s.listingId = b.id
//   `;
//
//   const skillCondition =
//     skillFilter !== 'ALL'
//       ? `AND (${skillCategories[skillFilter]
//         .map((skill) => `JSON_CONTAINS(JSON_EXTRACT(b.skills, '$[*].skills'), JSON_QUOTE('${skill}'))`)
//         .join(' OR ')})`
//       : '';
//
//   const dateCondition = dateFilter
//     ? dateFilter.range.length === 1
//       ? `AND b.createdAt >= '${dateFilter.range[0]}'`
//       : `AND b.createdAt BETWEEN '${dateFilter.range[0]}' AND '${dateFilter.range[1]}'`
//     : '';
//
//   const groupByClause = `
//     GROUP BY u.id
//   `;
//
//   const query = `
//     SELECT
//       userId,
//       '${skillFilter}' AS skill,
//       '${dateFilter ? dateFilter.label : 'ALL_TIME'}' AS timeframe,
//       RANK() OVER (ORDER BY score DESC) AS \`rank\`
//     FROM (
//       ${baseQuery}
//       WHERE 1=1
//       ${skillCondition}
//       ${dateCondition}
//       ${groupByClause}
//     ) AS ranking
//   `;
//
//   return query;
// }
