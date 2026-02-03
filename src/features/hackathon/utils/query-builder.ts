import type { z } from 'zod';

import { type JsonValue } from '@/prisma/internal/prismaNamespace';
import {
  type BountiesOrderByWithRelationInput,
  type BountiesWhereInput,
} from '@/prisma/models/Bounties';

import {
  filterRegionCountry,
  getCombinedRegion,
  getParentRegions,
} from '@/features/listings/utils/region';

import {
  HackathonNameOptions,
  type HackathonQueryParamsSchema,
  type HackathonStatusSchema,
} from '../constants/schema';

type BuildHackathonQueryArgs = z.infer<typeof HackathonQueryParamsSchema>;

interface HackathonQueryResult {
  readonly where: BountiesWhereInput;
  readonly orderBy:
    | BountiesOrderByWithRelationInput
    | BountiesOrderByWithRelationInput[];
  readonly take?: number;
}

function getStatusSpecificWhereClauses(
  status: z.infer<typeof HackathonStatusSchema>,
): BountiesWhereInput | null {
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
  args: BuildHackathonQueryArgs,
): BountiesOrderByWithRelationInput | BountiesOrderByWithRelationInput[] {
  const { sortBy, order } = args;

  switch (sortBy) {
    case 'Prize':
      return { usdValue: { sort: order, nulls: 'last' } };
    case 'Submissions':
      return { Submission: { _count: order } };
    default:
      return { deadline: { sort: order, nulls: 'last' } };
  }
}

export async function buildHackathonQuery(
  args: BuildHackathonQueryArgs,
  user: {
    id: string;
    isTalentFilled: boolean;
    location: string | null;
    skills: JsonValue;
  } | null,
): Promise<HackathonQueryResult> {
  const { name, status, context } = args;

  const where: BountiesWhereInput = {
    isPublished: true,
    isActive: true,
    isArchived: false,
    isPrivate: false,
    type: 'hackathon',
  };

  const allHackathonNames = HackathonNameOptions.filter(
    (option: string) => option !== 'All',
  );

  if (name === 'All') {
    where.Hackathon = { name: { in: allHackathonNames } };
  } else if (allHackathonNames.includes(name)) {
    where.Hackathon = { name: name };
  }

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
    const userRegion = user?.location
      ? getCombinedRegion(user?.location, true)
      : undefined;

    where.region = {
      in: userRegion?.name
        ? [
            'Global',
            userRegion.name,
            ...(filterRegionCountry(userRegion, user.location || '').country ||
              []),
            ...(getParentRegions(userRegion) || []),
          ]
        : ['Global'],
    };
  }

  const statusWhereClauses = getStatusSpecificWhereClauses(status);
  if (statusWhereClauses) {
    andConditions.push(statusWhereClauses);
  }

  if (andConditions.length > 0) {
    where.AND = andConditions;
  }

  const orderBy = getOrderBy(args);
  const takeValue = context === 'home' ? 10 : undefined;

  return {
    where,
    orderBy,
    take: takeValue,
  };
}
