import type { z } from 'zod';

import { type JsonValue } from '@/prisma/internal/prismaNamespace';
import { type GrantsWhereInput } from '@/prisma/models';

import {
  type GrantCategorySchema,
  type GrantQueryParamsSchema,
} from '@/features/grants/constants/schema';
import {
  filterRegionCountry,
  getCombinedRegion,
  getParentRegions,
} from '@/features/listings/utils/region';

type BuildGrantsQueryArgs = z.infer<typeof GrantQueryParamsSchema>;

interface GrantQueryResult {
  readonly where: GrantsWhereInput;
  readonly take?: number;
}

function getSkillFilter(
  category: z.infer<typeof GrantCategorySchema>,
): GrantsWhereInput | null {
  if (category === 'All') {
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

export async function buildGrantsQuery(
  args: BuildGrantsQueryArgs,
  user: {
    id: string;
    isTalentFilled: boolean;
    location: string | null;
    skills: JsonValue;
  } | null,
): Promise<GrantQueryResult> {
  const { category, context, region, sponsor } = args;

  const where: GrantsWhereInput = {
    isPublished: true,
    isActive: true,
    isArchived: false,
    isPrivate: false,
  };

  const andConditions: GrantsWhereInput[] = [];

  if (user?.isTalentFilled && (context === 'all' || context === 'home')) {
    where.region = {
      in: getUserRegionFilter(user.location),
    };
  }

  if (context === 'region' && region) {
    where.region = {
      in: [region.charAt(0).toUpperCase() + region.slice(1), 'Global'],
    };
  }

  if (context === 'sponsor' && sponsor) {
    where.sponsor = {
      name: sponsor,
    };
  }

  const skillFilter = getSkillFilter(category);
  if (skillFilter) {
    andConditions.push(skillFilter);
  }

  if (andConditions.length > 0) {
    where.AND = andConditions;
  }

  const takeValue = context === 'home' ? 10 : undefined;

  return {
    where,
    take: takeValue,
  };
}
