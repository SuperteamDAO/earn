import { type Prisma, Regions } from '@prisma/client';
import type { z } from 'zod';

import { type PrismaUserWithoutKYC } from '@/interface/user';
import { prisma } from '@/prisma';

import {
  type ListingCategorySchema,
  type ListingStatusSchema,
  type QueryParamsSchema,
} from '@/features/listings/constants/schema';

import {
  filterRegionCountry,
  getCombinedRegion,
  getParentRegions,
} from './utils/region';

export type BuildListingQueryArgs = z.infer<typeof QueryParamsSchema>;

export interface ListingQueryResult {
  readonly where: Prisma.BountiesWhereInput;
  readonly orderBy:
    | Prisma.BountiesOrderByWithRelationInput
    | Prisma.BountiesOrderByWithRelationInput[];
  readonly take?: number;
}

function getSkillFilter(
  pill: z.infer<typeof ListingCategorySchema>,
): Prisma.BountiesWhereInput | null {
  if (pill === 'All' || pill === 'For You') {
    return null;
  }

  const filterToSkillsMap: Record<string, string[]> = {
    Development: ['Frontend', 'Backend', 'Blockchain', 'Mobile'],
    Design: ['Design'],
    Content: ['Content'],
    Other: ['Other', 'Growth', 'Community'],
  };

  const skillsToFilter = filterToSkillsMap[pill] || [];

  if (skillsToFilter.length === 0) {
    return null;
  }

  if (pill === 'Development' || pill === 'Other') {
    return {
      OR: skillsToFilter.map((skill) => ({
        skills: {
          path: '$[*].skills',
          array_contains: [skill],
        },
      })),
    };
  } else {
    return {
      skills: {
        path: '$[*].skills',
        array_contains: skillsToFilter,
      },
    };
  }
}

function getStatusSpecificWhereClauses(
  status: z.infer<typeof ListingStatusSchema>,
): Prisma.BountiesWhereInput | null {
  const now = new Date();
  switch (status) {
    case 'open':
      return {
        isWinnersAnnounced: false,
        OR: [{ deadline: null }, { deadline: { gte: now } }],
      };
    case 'review':
      return {
        isWinnersAnnounced: false,
        deadline: { lt: now },
      };
    case 'completed':
      return {
        isWinnersAnnounced: true,
      };
    default:
      return null;
  }
}

function getOrderBy(
  args: BuildListingQueryArgs,
):
  | Prisma.BountiesOrderByWithRelationInput
  | Prisma.BountiesOrderByWithRelationInput[] {
  const { sortBy, order } = args;

  switch (sortBy) {
    case 'Due Date':
      return { deadline: { sort: order, nulls: 'last' } };
    case 'Prize':
      return { usdValue: { sort: order, nulls: 'last' } };
    case 'Submissions':
      return { Submission: { _count: order } };
    default:
      return { deadline: { sort: order, nulls: 'last' } };
  }
}

export async function buildListingQuery(
  args: BuildListingQueryArgs,
  user: PrismaUserWithoutKYC | null,
): Promise<ListingQueryResult> {
  const { tab, pill, status, context } = args;

  const where: Prisma.BountiesWhereInput = {
    isPublished: true,
    isActive: true,
    isArchived: false,
    isPrivate: false,
    hackathonprize: false,
  };

  const andConditions: Prisma.BountiesWhereInput[] = [];

  if (context === 'home') {
    andConditions.push({
      language: { in: ['eng', 'sco'] },
      OR: [
        { compensationType: 'fixed', usdValue: { gt: 100 } },
        { compensationType: 'range', maxRewardAsk: { gt: 100 } },
        { compensationType: 'variable' },
      ],
    });
  }

  if (user?.isTalentFilled) {
    const userRegion = user?.location
      ? getCombinedRegion(user?.location, true)
      : undefined;

    where.region = {
      in: userRegion?.name
        ? [
            Regions.GLOBAL,
            userRegion.name,
            ...(filterRegionCountry(userRegion, user.location || '').country ||
              []),
            ...(getParentRegions(userRegion) || []),
          ]
        : [Regions.GLOBAL],
    };

    if (pill === 'For You') {
      const subscribedListings = await prisma.subscribeBounty.findMany({
        where: { userId: user.id },
        select: { bountyId: true },
      });
      const subscribedListingIds = subscribedListings.map(
        (sub) => sub.bountyId,
      );

      const userSkills =
        (user?.skills as { skills: string }[] | null)?.map(
          (skill) => skill.skills,
        ) || [];

      const forYouConditions: Prisma.BountiesWhereInput[] = [];

      if (subscribedListingIds && subscribedListingIds.length > 0) {
        forYouConditions.push({ id: { in: subscribedListingIds } });
      }

      if (userSkills.length > 0) {
        const skillConditions = userSkills.map((skill) => ({
          skills: {
            path: '$[*].skills',
            array_contains: [skill],
          },
        }));
        forYouConditions.push(...skillConditions);
      }

      if (forYouConditions.length > 0) {
        andConditions.push({ OR: forYouConditions });
      }
    }
  }

  switch (tab) {
    case 'Bounties':
      where.type = 'bounty';
      break;
    case 'Projects':
      where.type = 'project';
      break;
    case 'All Open':
      where.type = { not: 'hackathon' };
      break;
  }

  const statusWhereClauses = getStatusSpecificWhereClauses(status);
  if (statusWhereClauses) {
    andConditions.push(statusWhereClauses);
  }

  const skillFilter = getSkillFilter(pill);
  if (skillFilter) {
    andConditions.push(skillFilter);
  }

  if (andConditions.length > 0) {
    where.AND = andConditions;
  }

  const orderBy = getOrderBy(args);
  const takeValue = context === 'home' ? 5 : undefined;

  return {
    where,
    orderBy,
    take: takeValue,
  };
}
