import { status as Status } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';

import type { Bounties } from '@/interface/listings';
import { prisma } from '@/prisma';

// GOTTA SAVE FROM SQL INJECTION
function checkInvalidItems(obj: object, arr: string[]): boolean {
  return arr.some((s) => !(s in obj));
}

function duplicateElements(array: string[], count: number) {
  return array.flatMap((item) => Array(count).fill(item));
}

// function operatorsToWords(input: string): string {
//   const words = input.trim().split(/\s+/);
//   const modifiedWords = words.map(word => `${word}*`).join(' ');
//   return modifiedWords;
// }

const Skills = {
  DEVELOPMENT: 'DEVELOPMENT',
  DESIGN: 'DESIGN',
  CONTENT: 'CONTENT',
};

export default async function user(req: NextApiRequest, res: NextApiResponse) {
  const params = req.query;
  const query = params.query as string;

  console.log('query - ', query);

  const limit = (req.query.limit as string) || '5';

  const offset = (req.query.offset as string) || null;

  const status = req.query.status as string;
  let statusList: string[] = [];
  if (status) statusList = status.split(',');
  if (checkInvalidItems(Status, statusList))
    return res.status(400).send('query status is not valid');

  const skills = req.query.skills as string;
  let skillList: string[] = [];
  if (skills) skillList = skills.split(',');
  if (checkInvalidItems(Skills, skillList))
    return res.status(400).send('query skills is not valid');

  const filterToSkillsMap: Record<string, string[]> = {
    DEVELOPMENT: ['Frontend', 'Backend', 'Blockchain', 'Mobile'],
    DESIGN: ['Design'],
    CONTENT: ['Content'],
  };

  const skillsFlattened = skillList.reduce((acc: string[], category) => {
    const categorySkills = filterToSkillsMap[category] || [];
    return acc.concat(categorySkills);
  }, []);

  const skillsQuery = skillsFlattened
    .map(
      () =>
        `JSON_CONTAINS(JSON_EXTRACT(b.skills, '$[*].skills'), JSON_QUOTE(?))`,
    )
    .join(' OR ');

  console.log(skillsQuery);

  const words = query
    .split(/\s+/)
    .map((c) => c.trim())
    .filter((c) => c !== '');
  const whereClauses: string[] = [];

  words.forEach(() => {
    const soundexCondition = `(
b.title LIKE CONCAT('%', ?, '%') OR 
s.name LIKE CONCAT('%', ?, '%')
)`;
    whereClauses.push(soundexCondition);
  });

  const combinedWhereClause =
    whereClauses.length > 0 ? whereClauses.join(' AND ') : '1=1';

  const countQuery = `
SELECT COUNT(*) as totalCount
FROM (
  SELECT DISTINCT b.id
  FROM Bounties b
  JOIN Sponsors s ON b.sponsorId = s.id
  WHERE (1=1) AND (
b.isPublished = 1 AND
b.isPrivate = 0 AND
    ${combinedWhereClause} ${status && statusList.length > 0 ? `AND b.status IN (${statusList.map(() => '?').join(',')})` : ''} 
  ) ${skills ? ` AND (${skillsQuery})` : ''}
) as subquery;
`;

  const sqlQuery = `
SELECT DISTINCT b.id, 
b.rewardAmount, 
b.deadline, 
b.type, 
JSON_OBJECT('name', s.name, 'logo', s.logo) as sponsor,
b.title, 
b.token, 
b.slug, 
b.applicationType, 
b.isWinnersAnnounced, 
b.description, 
b.compensationType, 
b.minRewardAsk, 
b.maxRewardAsk,
b.updatedAt
FROM Bounties b
JOIN Sponsors s ON b.sponsorId = s.id
WHERE (1=1) AND (
b.isPublished = 1 AND
b.isPrivate = 0 AND
${combinedWhereClause} ${status && statusList.length > 0 ? `AND b.status IN (${statusList.map(() => '?').join(',')})` : ''} 
) ${skills ? ` AND (${skillsQuery})` : ''}
ORDER BY b.updatedAt DESC, b.id
LIMIT ? ${offset ? `OFFSET ?` : ''}
`;

  let values: (string | number)[] = duplicateElements(words, 2);
  if (status) values = values.concat(statusList);
  if (skills) values = values.concat(skillsFlattened);

  const bountiesCount = await prisma.$queryRawUnsafe<[{ totalCount: bigint }]>(
    countQuery,
    ...values,
  );
  // console.log('count query - ', countQuery);
  // console.log('count values - ', values);

  // console.log('bounties count - ', bountiesCount[0].totalCount.toString());

  // console.log('reuslts query - ', sqlQuery);
  values.push(Number(limit));
  if (offset) values.push(Number(offset));
  // console.log('results values - ', values);

  const bounties = await prisma.$queryRawUnsafe<Bounties[]>(
    sqlQuery,
    ...values,
  );

  console.log('bounties lenght - ', bounties.length);
  res
    .status(200)
    .json({ bounties, count: bountiesCount[0].totalCount.toString() });
}
