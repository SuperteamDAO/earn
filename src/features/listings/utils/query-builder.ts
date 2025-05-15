import { type Prisma, Regions } from '@prisma/client';
import type { z } from 'zod';

import { exclusiveSponsorData } from '@/constants/exclusiveSponsors';
import { Superteams } from '@/constants/Superteam';
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
} from './region';

type BuildListingQueryArgs = z.infer<typeof QueryParamsSchema>;

interface ListingQueryResult {
  readonly where: Prisma.BountiesWhereInput;
  readonly orderBy:
    | Prisma.BountiesOrderByWithRelationInput
    | Prisma.BountiesOrderByWithRelationInput[];
  readonly take?: number;
}

function getSkillFilter(
  category: z.infer<typeof ListingCategorySchema>,
): Prisma.BountiesWhereInput | null {
  if (category === 'All' || category === 'For You') {
    return null;
  }

  const filterToSkillsMap: Record<string, string[]> = {
    Development: ['Frontend', 'Backend', 'Blockchain', 'Mobile'],
    Design: ['Design'],
    Content: ['Content'],
    Other: ['Other', 'Growth', 'Community'],
  };

  const skillsToFilter = filterToSkillsMap[category] || [];

  if (skillsToFilter.length === 0) {
    return null;
  }

  if (category === 'Development' || category === 'Other') {
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
  status: z.infer<typeof ListingStatusSchema>,
):
  | Prisma.BountiesOrderByWithRelationInput
  | Prisma.BountiesOrderByWithRelationInput[] {
  const { sortBy, order } = args;
  const oppositeOrder = order === 'asc' ? 'desc' : 'asc';

  switch (sortBy) {
    case 'Date':
      if (status === 'review') {
        return { deadline: { sort: oppositeOrder, nulls: 'last' } };
      } else if (status === 'completed') {
        return { winnersAnnouncedAt: { sort: oppositeOrder, nulls: 'last' } };
      }
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
  user: {
    id: string;
    isTalentFilled: boolean;
    location: string | null;
    skills: Prisma.JsonValue;
  } | null,
): Promise<ListingQueryResult> {
  const { tab, category, status, context, region, sponsor } = args;

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

  if (user?.isTalentFilled && (context === 'all' || context === 'home')) {
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

    if (category === 'For You') {
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

  if ((context === 'region' || context === 'region-all') && region) {
    const st = Superteams.find((team) => team.region.toLowerCase() === region);
    const superteam = st?.name;

    where.OR = [
      {
        region: {
          in: [region.toUpperCase() as Regions, ...(st?.country || [])],
        },
      },
      {
        sponsor: {
          name: superteam,
        },
      },
    ];
  }

  if (context === 'sponsor' && sponsor) {
    const sponsorKey = sponsor.toLowerCase();

    const sponsorInfo = exclusiveSponsorData[sponsorKey];

    where.sponsor = {
      name: sponsorInfo?.title,
    };

    if (!!sponsorInfo?.showPrivates) {
      delete where.isPrivate;
    } else {
      where.isPrivate = false;
    }
  }

  switch (tab) {
    case 'bounties':
      where.type = 'bounty';
      break;
    case 'projects':
      where.type = 'project';
      break;
    case 'all':
      where.type = { not: 'hackathon' };
      break;
  }

  const statusWhereClauses = getStatusSpecificWhereClauses(status);
  if (statusWhereClauses) {
    andConditions.push(statusWhereClauses);
  }

  const skillFilter = getSkillFilter(category);
  if (skillFilter) {
    andConditions.push(skillFilter);
  }

  if (andConditions.length > 0) {
    where.AND = andConditions;
  }

  const orderBy = getOrderBy(args, status);
  const takeValue = context === 'home' || context === 'region' ? 10 : undefined;

  return {
    where,
    orderBy,
    take: takeValue,
  };
}
