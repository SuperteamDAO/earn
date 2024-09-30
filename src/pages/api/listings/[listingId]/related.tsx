import { type BountyType, Prisma } from '@prisma/client';
import { type NextApiRequest, type NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';

import { CombinedRegions } from '@/constants/Superteam';
import {
  type ParentSkills,
  type Skills,
  type SubSkillsType,
} from '@/interface/skills';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

export default async function relatedListings(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const params = req.query;
  const listingId = params.listingId as string;
  const take = params.take ? parseInt(params.take as string, 10) : 5;
  logger.debug(`Request query: ${safeStringify(req.query)}`);

  try {
    const token = await getToken({ req });
    const userId = token?.sub;
    let userRegion;

    if (userId) {
      const user = await prisma.user.findFirst({
        where: { id: userId },
        select: { location: true },
      });
      const matchedRegion = CombinedRegions.find(
        (region) => user?.location && region.country.includes(user?.location),
      );
      userRegion = matchedRegion?.region;
    }

    const listing = await prisma.bounties.findUnique({
      where: { id: listingId },
      select: { skills: true, type: true },
    });

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    const listingSkills = listing.skills as Skills;
    const devSkills = ['Frontend', 'Backend', 'Blockchain', 'Mobile'];
    const isDevListing = listingSkills.some((skill) =>
      devSkills.includes(skill.skills),
    );

    let relatedListings;

    if (isDevListing) {
      const subskills = listingSkills.flatMap((skill) => skill.subskills);
      relatedListings = await findRelatedListings(
        listingId,
        subskills,
        take,
        true,
        listing.type,
        userRegion,
      );
    } else {
      const mainSkills = listingSkills.map((skill) => skill.skills);
      relatedListings = await findRelatedListings(
        listingId,
        mainSkills,
        take,
        false,
        listing.type,
        userRegion,
      );
    }

    res
      .status(200)
      .json(
        JSON.parse(
          JSON.stringify(relatedListings, (_, value) =>
            typeof value === 'bigint' ? value.toString() : value,
          ),
        ),
      );
  } catch (error) {
    logger.error(`Error in relatedListings: ${safeStringify(error)}`);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function findRelatedListings(
  listingId: string,
  skills: (SubSkillsType | ParentSkills)[],
  take: number,
  isDevListing: boolean,
  type: BountyType,
  userRegion?: string,
) {
  const skillField = isDevListing ? 'subskills' : 'skills';
  const matchingField = isDevListing ? 'matchingSubskills' : 'matchingSkills';

  const skillQuery = Prisma.sql`(${Prisma.join(
    skills.map(
      (skill) =>
        Prisma.sql`JSON_CONTAINS(JSON_EXTRACT(skills, '$[*].${Prisma.raw(skillField)}'), JSON_QUOTE(${skill}))`,
    ),
    ' OR ',
  )})`;

  const regionFilter = userRegion
    ? Prisma.sql`AND (region = ${userRegion} OR region = 'GLOBAL')`
    : Prisma.empty;

  return await prisma.$queryRaw`
    SELECT 
      b.id,
      b.rewardAmount,
      b.deadline,
      b.type,
      b.title,
      b.token,
      b.winnersAnnouncedAt,
      b.slug,
      b.applicationType,
      b.isWinnersAnnounced,
      b.isFeatured,
      b.compensationType,
      b.minRewardAsk,
      b.maxRewardAsk,
      b.status,
      (
        SELECT COUNT(*)
        FROM Comment c
        WHERE c.listingId = b.id 
          AND c.isActive = true 
          AND c.isArchived = false
          AND c.replyToId IS NULL
          AND c.type != 'SUBMISSION'
      ) as _count_Comments,
      JSON_OBJECT(
        'name', s.name,
        'slug', s.slug,
        'logo', s.logo,
        'isVerified', s.isVerified
      ) as sponsor,
      SUM(
        CASE
          WHEN ${skillQuery} THEN 1
          ELSE 0
        END
      ) as ${Prisma.raw(matchingField)}
    FROM Bounties b
    LEFT JOIN Sponsors s ON b.sponsorId = s.id
    WHERE b.id != ${listingId}
      AND b.isPublished = true
      AND b.isActive = true
      AND b.status = 'OPEN'
      AND b.isWinnersAnnounced = false
      AND b.deadline > NOW()
      AND b.type = ${type}
      ${regionFilter}
      AND ${skillQuery}
    GROUP BY b.id
    ORDER BY b.deadline ASC, ${Prisma.raw(matchingField)} DESC
    LIMIT ${take}
  `;
}
