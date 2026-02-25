import type { z } from 'zod';

import { countries } from '@/constants/country';
import { type JsonValue } from '@/prisma/internal/prismaNamespace';
import { type GrantsWhereInput } from '@/prisma/models';
import {
  findChapterByRegionInput,
  getRegionsForChapterPage,
  getRegionsForCountryPageUsingChapters,
  getRegionsForMultiCountryRegionPageUsingChapters,
  getRegionsForUserLocationUsingChapters,
} from '@/utils/chapterRegion';

import {
  type GrantCategorySchema,
  type GrantQueryParamsSchema,
} from '@/features/grants/constants/schema';
import { findSkillBySlug } from '@/features/listings/utils/skill';

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

async function getUserRegionFilter(
  userLocation: string | null,
): Promise<string[]> {
  return getRegionsForUserLocationUsingChapters(userLocation);
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
  const { category, context, region, sponsor, skill } = args;

  const where: GrantsWhereInput = {
    isPublished: true,
    isActive: true,
    isArchived: false,
    isPrivate: false,
  };

  const andConditions: GrantsWhereInput[] = [];

  if (user?.isTalentFilled && (context === 'all' || context === 'home')) {
    where.region = {
      in: await getUserRegionFilter(user.location),
    };
  }

  if (context === 'region' && region) {
    // Check if this is a superteam region first
    const chapter = await findChapterByRegionInput(region);

    if (chapter) {
      const regionList = await getRegionsForChapterPage(chapter.region);
      where.region = {
        in: regionList,
      };
    } else {
      const country = countries.find(
        (c) => c.name.toLowerCase() === region.toLowerCase(),
      );

      if (country) {
        if (
          country.region &&
          country.regions &&
          Array.isArray(country.regions)
        ) {
          // Multi-country region page (EU, GCC, etc.)
          const regionList =
            await getRegionsForMultiCountryRegionPageUsingChapters(
              country.name,
            );
          where.region = {
            in: regionList,
          };
        } else {
          // Regular country page
          const regionList = await getRegionsForCountryPageUsingChapters(
            country.name,
          );
          where.region = {
            in: regionList,
          };
        }
      } else {
        // Fallback for unknown region
        where.region = {
          in: [region.charAt(0).toUpperCase() + region.slice(1), 'Global'],
        };
      }
    }
  }

  if (context === 'sponsor' && sponsor) {
    where.sponsor = {
      name: sponsor,
    };
  }

  if (context === 'skill' && skill) {
    const skillInfo = findSkillBySlug(skill);

    if (skillInfo) {
      if (skillInfo.type === 'parent') {
        // Filter by parent skill
        andConditions.push({
          skills: {
            path: '$[*].skills',
            array_contains: [skillInfo.name],
          },
        });
      } else {
        // Filter by subskill
        andConditions.push({
          skills: {
            path: '$[*].subskills',
            array_contains: [skillInfo.name],
          },
        });
      }
    }
  }

  if (context === 'pro') {
    where.isPro = true;
  }

  const shouldSkipCategoryFilter = context === 'skill' && category === 'All';

  const skillFilter = getSkillFilter(category);
  if (skillFilter && !shouldSkipCategoryFilter) {
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
