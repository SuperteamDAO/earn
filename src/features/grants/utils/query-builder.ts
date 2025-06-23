import { type Prisma } from '@prisma/client';
import type { z } from 'zod';

import { exclusiveSponsorData } from '@/constants/exclusiveSponsors';

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
  readonly where: Prisma.GrantsWhereInput;
  readonly take?: number;
}

function getSkillFilter(
  category: z.infer<typeof GrantCategorySchema>,
): Prisma.GrantsWhereInput | null {
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

export async function buildGrantsQuery(
  args: BuildGrantsQueryArgs,
  user: {
    id: string;
    isTalentFilled: boolean;
    location: string | null;
    skills: Prisma.JsonValue;
  } | null,
): Promise<GrantQueryResult> {
  const { category, context, region, sponsor } = args;

  const where: Prisma.GrantsWhereInput = {
    isPublished: true,
    isActive: true,
    isArchived: false,
    isPrivate: false,
  };

  const andConditions: Prisma.GrantsWhereInput[] = [];

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

  if (context === 'region' && region) {
    where.region = {
      in: [region.charAt(0).toUpperCase() + region.slice(1), 'Global'],
    };
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
