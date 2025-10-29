import type { z } from 'zod';

import { Superteams } from '@/constants/Superteam';
import { type JsonValue } from '@/prisma/internal/prismaNamespace';
import {
  type BountiesOrderByWithRelationInput,
  type BountiesWhereInput,
} from '@/prisma/models/Bounties';

import { HACKATHONS } from '@/features/hackathon/constants/hackathons';
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
  readonly where: BountiesWhereInput;
  readonly orderBy:
    | BountiesOrderByWithRelationInput
    | BountiesOrderByWithRelationInput[];
  readonly take?: number;
}

function getSkillFilter(
  category: z.infer<typeof ListingCategorySchema>,
): BountiesWhereInput | null {
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
): BountiesWhereInput | null {
  const now = new Date();
  switch (status) {
    case 'all':
      return null;
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
): BountiesOrderByWithRelationInput | BountiesOrderByWithRelationInput[] {
  const { sortBy, order } = args;
  const oppositeOrder = order === 'asc' ? 'desc' : 'asc';

  let primarySort: BountiesOrderByWithRelationInput;

  switch (sortBy) {
    case 'Status':
      return [
        { isWinnersAnnounced: 'asc' },
        { deadline: { sort: 'desc', nulls: 'first' } },
      ];

    case 'Date':
      if (status === 'review') {
        primarySort = { deadline: { sort: oppositeOrder, nulls: 'last' } };
      } else if (status === 'completed') {
        primarySort = {
          winnersAnnouncedAt: { sort: oppositeOrder, nulls: 'last' },
        };
      } else {
        primarySort = { deadline: { sort: order, nulls: 'last' } };
      }
      break;

    case 'Prize':
      primarySort = { usdValue: { sort: order, nulls: 'last' } };
      break;

    case 'Submissions':
      primarySort = { Submission: { _count: order } };
      break;

    default:
      primarySort = { deadline: { sort: order, nulls: 'last' } };
      break;
  }

  // add isFeatured prioritization only for default sorting (date + asc) and open or all status
  const isDefaultSort =
    sortBy === 'Date' &&
    order === 'asc' &&
    (status === 'open' || status === 'all');

  return isDefaultSort ? [{ isFeatured: 'desc' }, primarySort] : primarySort;
}

function getUserRegionFilter(userLocation: string | null): string[] {
  if (!userLocation) return ['Global'];

  const userRegion = getCombinedRegion(userLocation, true);
  const regions = userRegion?.name
    ? [
        'Global',
        userRegion.name,
        ...(filterRegionCountry(userRegion, userLocation).country || []),
        ...(getParentRegions(userRegion) || []),
      ]
    : ['Global'];
  return regions;
}

export async function buildListingQuery(
  args: BuildListingQueryArgs,
  user: {
    id: string;
    isTalentFilled: boolean;
    location: string | null;
    skills: JsonValue;
  } | null,
): Promise<ListingQueryResult> {
  const { tab, category, status, context, region, sponsor } = args;

  const where: BountiesWhereInput = {
    isPublished: true,
    isActive: true,
    isArchived: false,
    isPrivate: false,
    hackathonprize: false,
  };

  const andConditions: BountiesWhereInput[] = [];

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
    where.region = {
      in: getUserRegionFilter(user.location),
    };
  }

  if (category === 'For You') {
    const userSkills =
      (user?.skills as { skills: string }[] | null)?.map(
        (skill) => skill.skills,
      ) || [];

    const forYouConditions: BountiesWhereInput[] = [];

    if (user?.id) {
      forYouConditions.push({
        SubscribeBounty: { some: { userId: user.id } },
      });
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

    forYouConditions.push({
      isFeatured: true,
    });

    if (forYouConditions.length > 0) {
      andConditions.push({ OR: forYouConditions });
    }
  }

  if ((context === 'region' || context === 'region-all') && region) {
    const st = Superteams.find((team) => team.region.toLowerCase() === region);
    const superteam = st?.name;

    where.OR = [
      {
        region: {
          in: [
            region.charAt(0).toUpperCase() + region.slice(1),
            ...(st?.country || []),
          ],
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

    where.sponsor = {
      slug: sponsorKey,
    };

    // if (!!sponsorInfo?.showPrivates) {
    //   delete where.isPrivate;
    // } else {
    //   where.isPrivate = false;
    // }
  }

  const standardTabs = ['all', 'bounties', 'projects'];

  if (standardTabs.includes(tab)) {
    switch (tab) {
      case 'bounties':
        where.type = 'bounty';
        break;
      case 'projects':
        where.type = 'project';
        break;
      case 'all':
        where.OR = [
          { type: { not: 'hackathon' } },
          { type: 'hackathon', isFeatured: true },
        ];
        break;
    }
  } else if (HACKATHONS.some((hackathon) => hackathon.slug === tab)) {
    where.type = 'hackathon';
    where.Hackathon = {
      slug: tab,
    };
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
