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

const Skills = {
  DEVELOPMENT: 'DEVELOPMENT',
  DESIGN: 'DESIGN',
  CONTENT: 'CONTENT',
  OTHER: 'OTHER',
};

export default async function user(req: NextApiRequest, res: NextApiResponse) {
  const params = req.query;
  const query = (params.query as string).replace(/[^a-zA-Z0-9 _-]/g, '');

  const limit = (req.query.limit as string) || '5';

  const offset = (req.query.offset as string) || null;

  const status = req.query.status as string;
  let statusList: string[] = [];
  if (status) statusList = status.split(',');
  if (checkInvalidItems(Status, statusList))
    return res.status(400).send('query status is not valid');

  const statusQuery = [];
  if (statusList.includes(Status.OPEN)) {
    statusQuery.push('b.deadline > CURRENT_TIMESTAMP');
  }
  if (statusList.includes(Status.REVIEW)) {
    statusQuery.push(
      'b.deadline <= CURRENT_TIMESTAMP AND b.isWinnersAnnounced = 0',
    );
  }
  if (statusList.includes(Status.CLOSED)) {
    statusQuery.push('b.isWinnersAnnounced = 1');
  }

  const skills = req.query.skills as string;
  let skillList: string[] = [];
  if (skills) skillList = skills.split(',');
  if (checkInvalidItems(Skills, skillList))
    return res.status(400).send('query skills is not valid');

  const filterToSkillsMap: Record<string, string[]> = {
    DEVELOPMENT: ['Frontend', 'Backend', 'Blockchain', 'Mobile'],
    DESIGN: ['Design'],
    CONTENT: ['Content'],
    OTHER: ['Other', 'Growth', 'Community'],
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

  const words = query
    .split(/\s+/)
    .map((c) => c.trim())
    .filter((c) => c !== '');
  const whereClauses: string[] = [];

  words.forEach(() => {
    const multiWordCondition = `(
b.title LIKE CONCAT('%', ?, '%') OR 
s.name LIKE CONCAT('%', ?, '%')
)`;
    whereClauses.push(multiWordCondition);
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
${combinedWhereClause} ${statusQuery.length > 0 ? ` AND ( ${statusQuery.join(' OR ')} )` : ''} 
) ${skills ? ` AND (${skillsQuery})` : ''}
) as subquery;
`;

  const sqlQuery = `
SELECT DISTINCT b.id, 
b.status,
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
b.updatedAt,
b.winnersAnnouncedAt,
b.isFeatured,
        JSON_OBJECT(
            'Comments', 
            (
                SELECT COUNT(*)
                FROM Comment c
                WHERE c.listingId = b.id
                  AND c.isActive = TRUE
                  AND c.isArchived = FALSE
                  AND c.replyToId IS NULL
                  AND c.type != 'SUBMISSION'
            )
        ) AS _count
FROM Bounties b
JOIN Sponsors s ON b.sponsorId = s.id
WHERE (1=1) AND (
b.isPublished = 1 AND
b.isPrivate = 0 AND
${combinedWhereClause} ${statusQuery.length > 0 ? ` AND ( ${statusQuery.join(' OR ')} )` : ''} 
) ${skills ? ` AND (${skillsQuery})` : ''}
ORDER BY 
  CASE 
    WHEN b.deadline >= CURRENT_TIMESTAMP THEN 1
    ELSE 2
  END,
  CASE 
    WHEN b.deadline >= CURRENT_TIMESTAMP THEN b.deadline
    ELSE NULL
  END ASC,
  CASE 
    WHEN b.deadline < CURRENT_TIMESTAMP THEN b.deadline
    ELSE NULL
  END DESC,
  b.updatedAt DESC, b.id
LIMIT ? ${offset ? `OFFSET ?` : ''}
`;

  let values: (string | number)[] = duplicateElements(words, 2);
  if (skills) values = values.concat(skillsFlattened);

  try {
    const bountiesCount = await prisma.$queryRawUnsafe<
      [{ totalCount: bigint }]
    >(countQuery, ...values);

    values.push(Number(limit));
    if (offset) values.push(Number(offset));

    const bounties = await prisma.$queryRawUnsafe<Bounties[]>(
      sqlQuery,
      ...values,
    );

    res
      .status(200)
      .json({ bounties, count: bountiesCount[0].totalCount.toString() });
  } catch (err) {
    console.log('err - ', err);
    res.status(500);
  }
}
