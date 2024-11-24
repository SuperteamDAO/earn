import { Regions, status as Status } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';

import { CombinedRegions } from '@/constants/Superteam';
import { type GrantsSearch, type ListingSearch } from '@/features/search';
import logger from '@/lib/logger';
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
  const query = (params.query as string).replace(
    /[^a-zA-Z0-9 _\-@#$.&*():+=]/g,
    ' ',
  );

  const bountiesLimit = (req.query.bountiesLimit as string) || 5;
  const grantsLimit = (req.query.grantsLimit as string) || 2;
  const bountiesOffset = (req.query.bountiesOffset as string) || null;
  const grantsOffset = (req.query.grantsOffset as string) || null;

  // let userRegion = params.userRegion as Regions | undefined;

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

  const token = await getToken({ req });
  const userId = token?.sub;
  if (userId) {
    const user = await prisma.user.findFirst({
      where: { id: userId },
      select: { location: true },
    });

    // const matchedRegion = CombinedRegions.find(
    //   (region) => user?.location && region.country.includes(user?.location),
    // );
    // userRegion = matchedRegion?.region;
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

  let regionFilter = '';
  // if (userRegion) {
  //   regionFilter = `AND (b.region = ? OR b.region = '${Regions.GLOBAL}')`;
  // }

  const words = query
    .split(/\s+/)
    .map((c) => c.trim())
    .filter((c) => c !== '');
  const wordClauses: string[] = [];

  words.forEach(() => {
    const multiWordCondition = `(
b.title LIKE CONCAT('%', ?, '%') OR
s.name LIKE CONCAT('%', ?, '%')
)`;
    wordClauses.push(multiWordCondition);
  });

  const hackathonQuery = `
  SELECT id
  FROM Hackathon
  WHERE name LIKE CONCAT('%', ?, '%')
  LIMIT 1
`;

  let hackathonId: string | null = null;
  const [hackathonResult] = await prisma.$queryRawUnsafe<
    [{ id: string } | undefined]
  >(hackathonQuery, query);

  if (hackathonResult) {
    hackathonId = hackathonResult.id;
  }

  const combinedWordClause =
    wordClauses.length > 0 ? wordClauses.join(' AND ') : '1=1';

  const hackathonIdQuery = 'b.hackathonId = ?';

  const bountiesCountQuery = `
    SELECT COUNT(*) as totalCount
    FROM (
    SELECT DISTINCT b.id
    FROM Bounties b
    JOIN Sponsors s ON b.sponsorId = s.id
    WHERE (1=1) AND (
    b.isPublished = 1 AND
    b.isPrivate = 0 AND
    (
      ${combinedWordClause}
      ${hackathonId ? `OR ${hackathonIdQuery}` : ''}
    )
      ${statusQuery.length > 0 ? ` AND ( ${statusQuery.join(' OR ')} )` : ''}
    ) ${skills ? ` AND (${skillsQuery})` : ''}
    ${regionFilter}
    ) as subquery;
    `;

  const grantsCountQuery = `
    SELECT COUNT(*) as totalCount
    FROM (
    SELECT DISTINCT b.id
    FROM Grants b
    JOIN Sponsors s ON b.sponsorId = s.id
    WHERE (1=1) AND (
    b.isPublished = 1 AND
    b.isActive = 1 AND
    b.isArchived = 0 AND
    b.isPrivate = 0 AND
    ${combinedWordClause}
    ) ${skills ? ` AND (${skillsQuery})` : ''}
    ${regionFilter}
    ) as subquery;
  `;

  const bountiesQuery = `
    SELECT DISTINCT b.id,
    b.status,
    b.rewardAmount,
    b.deadline,
    b.type,
    JSON_OBJECT('name', s.name, 'logo', s.logo, 'isVerified', s.isVerified) as sponsor,
    b.title,
    b.token,
    b.slug,
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
                    WHERE c.refId = b.id
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
    (
      ${combinedWordClause}
      ${hackathonId ? `OR ${hackathonIdQuery}` : ''}
    )
      ${statusQuery.length > 0 ? ` AND ( ${statusQuery.join(' OR ')} )` : ''}
    ) ${skills ? ` AND (${skillsQuery})` : ''}
    ${regionFilter}
    ORDER BY
    b.isFeatured DESC,
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
    LIMIT ? ${bountiesOffset ? `OFFSET ?` : ''}
    `;

  const grantsQuery = `
    SELECT DISTINCT b.id,
    b.title,
    b.slug,
    b.description,
    b.minReward,
    b.maxReward,
    b.token,
    b.link,
    b.region,
    b.createdAt,
    b.updatedAt,
    b.totalApproved,
    b.historicalApplications,
    JSON_OBJECT('name', s.name, 'logo', s.logo, 'isVerified', s.isVerified) as sponsor,
    (
      SELECT COUNT(*)
      FROM GrantApplication ga
      WHERE ga.grantId = b.id AND (ga.applicationStatus = 'Approved' OR ga.applicationStatus = 'Completed')
    ) as approvedApplications
    FROM Grants b
    JOIN Sponsors s ON b.sponsorId = s.id
    WHERE b.isPublished = 1 AND b.isActive = 1 AND b.isArchived = 0 AND b.isPrivate = 0
    AND (${combinedWordClause})
    ${skills ? ` AND (${skillsQuery})` : ''}
    ${regionFilter}
    ORDER BY b.createdAt DESC
    LIMIT ? ${grantsOffset ? `OFFSET ?` : ''}
  `;

  let bountiesValues: (string | number)[] = duplicateElements(words, 2);
  if (hackathonId) bountiesValues.push(hackathonId);
  if (skills) bountiesValues = bountiesValues.concat(skillsFlattened);
  // if (userRegion) bountiesValues.push(userRegion);

  let grantsValues: (string | number)[] = duplicateElements(words, 2);
  if (skills) grantsValues = grantsValues.concat(skillsFlattened);
  // if (userRegion) grantsValues.push(userRegion);

  try {
    let grantsCount: [{ totalCount: bigint }] = [{ totalCount: BigInt(0) }];
    let grants: GrantsSearch[] = [];
    if (statusList.length === 0 || statusList.includes(Status.OPEN)) {
      logger.debug(
        `Executing grants table countQuery with values: ${grantsValues}`,
      );
      grantsCount = await prisma.$queryRawUnsafe<[{ totalCount: bigint }]>(
        grantsCountQuery,
        ...grantsValues,
      );

      grantsValues.push(Number(grantsLimit));
      if (grantsOffset) grantsValues.push(Number(grantsOffset));

      logger.debug(
        `Executing grants table sqlQuery with values: ${grantsValues}`,
      );
      grants = await prisma.$queryRawUnsafe<GrantsSearch[]>(
        grantsQuery,
        ...grantsValues,
      );

      grants = grants.map((g) => ({
        ...g,
        approvedApplications: Number(g.approvedApplications),
        _count: {
          GrantApplication: Number(g.approvedApplications),
        },
        searchType: 'grants',
      }));
    }

    logger.debug(
      `Executing bounties table countQuery with values: ${bountiesValues}`,
    );
    const bountiesCount = await prisma.$queryRawUnsafe<
      [{ totalCount: bigint }]
    >(bountiesCountQuery, ...bountiesValues);

    bountiesValues.push(Number(bountiesLimit) - grants.length);
    if (bountiesOffset) bountiesValues.push(Number(bountiesOffset));

    logger.debug(
      `Executing bounties table sqlQuery with values: ${bountiesValues}`,
    );
    let bounties = await prisma.$queryRawUnsafe<ListingSearch[]>(
      bountiesQuery,
      ...bountiesValues,
    );

    bounties = bounties.map((b) => ({
      ...b,
      searchType: 'listing',
    }));

    const grantsWithTotalApplications = grants.map((grant) => ({
      ...grant,
      totalApplications:
        grant.approvedApplications + grant.historicalApplications,
    }));

    const results = [...bounties, ...grantsWithTotalApplications];

    res.status(200).json({
      results,
      count: (
        bountiesCount[0].totalCount + grantsCount[0].totalCount
      ).toString(),
      bountiesCount: bounties.length,
      grantsCount: grantsWithTotalApplications.length,
    });
  } catch (err: any) {
    logger.error('Error fetching bounties or grants:', err);
    res
      .status(500)
      .json({ error: 'Internal server error', details: err.message });
  }
}
