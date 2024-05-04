import { type NextApiRequest, type NextApiResponse } from 'next';

import { firstDayOfYear } from '@/features/leaderboard';
import { prisma } from '@/prisma';

interface RankingCriterion {
  field: string;
  table: string;
  weight: number;
  aggregation: string;
  alias?: string;
}

const rankingCriteria: RankingCriterion[] = [
  {
    field: 'totalEarnedInUSD',
    table: 'u',
    weight: 0.5,
    aggregation: 'SUM',
    alias: 'totalEarnedInUSD',
  },
  {
    field: 'isWinner',
    table: 's',
    weight: 0.5,
    aggregation: 'AVG',
    alias: 'winRate',
  },
];

type SKILL_FILTER = 'DEVELOPMENT' | 'DESIGN' | 'CONTENT' | 'OTHER' | 'ALL';

const skillCategories: Record<SKILL_FILTER, string[]> = {
  DEVELOPMENT: ['Frontend', 'Backend', 'Blockchain', 'Mobile'],
  DESIGN: ['Design'],
  CONTENT: ['Content'],
  OTHER: ['Other', 'Growth', 'Community'],
  ALL: [],
};

function generateSQLComponents(
  criteria: RankingCriterion[],
  skillFilter?: SKILL_FILTER,
  dateRange?: [string] | [string, string],
) {
  const selectParts: string[] = [];
  const joinParts: string[] = [
    'LEFT JOIN Submission s ON s.userId = u.id',
    'LEFT JOIN Bounties b ON s.listingId = b.id',
  ];
  const whereParts: string[] = []; // Prepare for additional where clauses

  if (skillFilter && skillFilter !== 'ALL') {
    const skillsArray = skillCategories[skillFilter]
      .map((skill) => `"${skill}"`)
      .join(', ');
    whereParts.push(
      `JSON_CONTAINS(JSON_EXTRACT(b.skills, '$[*].skills'), JSON_ARRAY(${skillsArray}))`,
    );
  }

  if (dateRange) {
    const dateFilter =
      dateRange.length === 1
        ? `s.createdAt >= '${dateRange[0]}'`
        : `s.createdAt BETWEEN '${dateRange[0]}' AND '${dateRange[1]}'`;
    whereParts.push(dateFilter);
  }

  criteria.forEach((criterion) => {
    const fieldExpression = `${criterion.aggregation}(${criterion.table}.${criterion.field})`;
    const selectExpression = criterion.alias
      ? `${fieldExpression} AS ${criterion.alias}`
      : fieldExpression;
    selectParts.push(selectExpression);

    // if (criterion.table !== 'users' && criterion.table !== 'bounties') {
    //   joinParts.push(`LEFT JOIN ${criterion.table} ON users.userId = ${criterion.table}.userId`);
    // }
  });

  const normalizationSelect = criteria
    .map(
      (c) =>
        `(${c.weight} * ((${c.alias || c.field} - MIN(${c.alias || c.field}) OVER ()) / (MAX(${c.alias || c.field}) - MIN(${c.alias || c.field}) OVER ())))`,
    )
    .join(' + ');

  return {
    selectClause: selectParts.join(', '),
    joinClause: joinParts.join(' '),
    whereClause: whereParts.join(' AND '),
    normalizationSelect,
  };
}

// Example usage to create queries for each skill filter
const skillsFilter: SKILL_FILTER[] = [
  'ALL',
  'DEVELOPMENT',
  'OTHER',
  'DESIGN',
  'CONTENT',
];

export default async function user(_: NextApiRequest, res: NextApiResponse) {
  // TODO: convert to only POST request later

  const allQueries = skillsFilter.map((skillFilter) => {
    const sqlComponents = generateSQLComponents(
      rankingCriteria,
      skillFilter,
      firstDayOfYear(),
    );
    return `
WITH WinData AS (
SELECT userId, ${sqlComponents.selectClause}
FROM User u
${sqlComponents.joinClause}
WHERE ${sqlComponents.whereClause}
GROUP BY userId
),
NormalizedData AS (
SELECT userId, ${sqlComponents.normalizationSelect} AS finalScore
FROM WinData
)
INSERT INTO TalentRankings (userId, skill, timeframe, rank)
SELECT 
userId, 
'${skillFilter}',
'THIS_YEAR',
RANK() OVER (ORDER BY finalScore DESC)
FROM NormalizedData
ON DUPLICATE KEY UPDATE rank = VALUES(rank);
`;
  });
  try {
    console.log(allQueries[0]);
    if (allQueries[0]) {
      const result = await prisma.$executeRawUnsafe(allQueries[0]);
      console.log('result', result);
    }
    res.send('done');
  } catch (err) {
    console.log('Erorr', JSON.stringify(err, null, 2));
    res.send('fail');
  }
}
