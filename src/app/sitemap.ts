import type { MetadataRoute } from 'next';

import { countries } from '@/constants/country';
import { getSiteUrl, isProductionEnv } from '@/lib/site-url';
import { prisma } from '@/prisma';
import { getChapterRegions } from '@/utils/chapterRegion';

import { getAllCategorySlugs } from '@/features/listings/utils/category';
import {
  generateCanonicalSlug,
  type ParsedOpportunityTags,
} from '@/features/listings/utils/parse-opportunity-tags';
import { getAllRegionSlugs } from '@/features/listings/utils/region';
import {
  getAllSkillSlugs,
  getParentSkillSlugs,
} from '@/features/listings/utils/skill';

const baseUrl = getSiteUrl();
const MAX_URLS_PER_SITEMAP = 50000;

let cachedOpportunityCombinations: readonly string[] | null = null;
let cachedRegionSlugs: readonly string[] | null = null;

export const revalidate = 86400; // 1 day

function getStaticRoutes(now: Date): MetadataRoute.Sitemap {
  return [
    {
      url: `${baseUrl}/`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/collaborate/`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/fast-track/`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/member-perks/`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/projects/`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/earn/jobs/`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.95,
    },
    {
      url: `${baseUrl}/earn/bounties/`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.95,
    },
    {
      url: `${baseUrl}/earn/grants/`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/earn/all/`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/earn/projects/`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.95,
    },
    {
      url: `${baseUrl}/earn/sponsor/`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/earn/new/`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/earn/feed/`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/earn/search/`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/earn/agents/`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/earn/agents/listings/`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ];
}

async function getStaticRoutesCount(): Promise<number> {
  return getStaticRoutes(new Date()).length;
}

async function getListingsCount(): Promise<number> {
  return await prisma.bounties.count({
    where: {
      status: 'OPEN',
      isPublished: true,
      isActive: true,
      isPrivate: false,
    },
  });
}

async function getSponsorsCount(): Promise<number> {
  return await prisma.sponsors.count({
    where: {
      isActive: true,
      isArchived: false,
    },
  });
}

async function getGrantsCount(): Promise<number> {
  return await prisma.grants.count({
    where: {
      isPublished: true,
      isActive: true,
      isArchived: false,
      isPrivate: false,
    },
  });
}

async function getRegionsCount(): Promise<number> {
  const regionSlugs = await getRegionSlugsForSitemap();
  return regionSlugs.length;
}

/**
 * Get short aliases for multi-country regions (where region: true)
 * Uses the code field as the alias slug
 */
function getMultiCountryRegionAliases(): string[] {
  return countries
    .filter((c) => 'region' in c && c.region === true)
    .map((c) => c.code.toLowerCase());
}

/**
 * Generate opportunity tag combinations for sitemap
 * Only includes type + (region | skill | category) combinations to avoid
 * overly large, thin, or low-value sitemap sets.
 *
 * Single tags have dedicated pages:
 * - Types: /bounties/, /projects/, /grants/
 * - Categories: /category/{slug}/
 * - Regions: /regions/{slug}/
 * - Skills: /skill/{slug}/
 */
async function getRegionSlugsForSitemap(): Promise<readonly string[]> {
  if (cachedRegionSlugs) {
    return cachedRegionSlugs;
  }

  const chapterRegions = await getChapterRegions();
  cachedRegionSlugs = getAllRegionSlugs(chapterRegions);
  return cachedRegionSlugs;
}

async function generateOpportunityCombinations(): Promise<readonly string[]> {
  if (cachedOpportunityCombinations) {
    return cachedOpportunityCombinations;
  }

  const types = ['bounties', 'projects', 'grants'] as const;
  const baseRegions = await getRegionSlugsForSitemap();
  // Include both full slugs and short aliases for multi-country regions
  const multiCountryAliases = getMultiCountryRegionAliases();
  const regions = [...baseRegions, ...multiCountryAliases];
  const skills = getParentSkillSlugs();
  const categories = getAllCategorySlugs();

  const combinations: string[] = [];

  // Two-tag combinations: type + region
  for (const type of types) {
    for (const region of regions) {
      const tags: ParsedOpportunityTags = { type, region };
      combinations.push(generateCanonicalSlug(tags));
    }
  }

  // Two-tag combinations: type + skill
  for (const type of types) {
    for (const skill of skills) {
      const tags: ParsedOpportunityTags = { type, skill };
      combinations.push(generateCanonicalSlug(tags));
    }
  }

  // Two-tag combinations: type + category
  for (const type of types) {
    for (const category of categories) {
      const tags: ParsedOpportunityTags = { type, category };
      combinations.push(generateCanonicalSlug(tags));
    }
  }

  // Remove duplicates and return
  cachedOpportunityCombinations = Array.from(new Set(combinations));
  return cachedOpportunityCombinations;
}

async function getOpportunitiesCount(): Promise<number> {
  const combinations = await generateOpportunityCombinations();
  return combinations.length;
}

async function getSkillsCount(): Promise<number> {
  return getAllSkillSlugs().length;
}

async function getCategoriesCount(): Promise<number> {
  return getAllCategorySlugs().length;
}

async function getTalentProfilesCount(): Promise<number> {
  return await prisma.user.count({
    where: {
      username: {
        not: null,
      },
      isTalentFilled: true,
      private: false,
      TalentRankings: {
        some: {
          totalEarnedInUSD: {
            gt: 0,
          },
        },
      },
    },
  });
}

function calculateSitemapCount(totalCount: number): number {
  if (totalCount <= 0) return 0;
  return Math.ceil(totalCount / MAX_URLS_PER_SITEMAP);
}

export async function generateSitemaps(): Promise<Array<{ id: number }>> {
  if (!isProductionEnv()) {
    return [];
  }

  try {
    const [
      staticRoutesCount,
      listingsCount,
      sponsorsCount,
      grantsCount,
      regionsCount,
      skillsCount,
      categoriesCount,
      talentCount,
      opportunitiesCount,
    ] = await Promise.all([
      getStaticRoutesCount(),
      getListingsCount(),
      getSponsorsCount(),
      getGrantsCount(),
      getRegionsCount(),
      getSkillsCount(),
      getCategoriesCount(),
      getTalentProfilesCount(),
      getOpportunitiesCount(),
    ]);

    const sitemaps: Array<{ id: number }> = [];
    let currentId = 0;

    const staticSitemapCount = calculateSitemapCount(staticRoutesCount);
    for (let i = 0; i < staticSitemapCount; i++) {
      sitemaps.push({ id: currentId++ });
    }

    const listingsSitemapCount = calculateSitemapCount(listingsCount);
    for (let i = 0; i < listingsSitemapCount; i++) {
      sitemaps.push({ id: currentId++ });
    }

    const sponsorsSitemapCount = calculateSitemapCount(sponsorsCount);
    for (let i = 0; i < sponsorsSitemapCount; i++) {
      sitemaps.push({ id: currentId++ });
    }

    const grantsSitemapCount = calculateSitemapCount(grantsCount);
    for (let i = 0; i < grantsSitemapCount; i++) {
      sitemaps.push({ id: currentId++ });
    }

    const talentSitemapCount = calculateSitemapCount(talentCount);
    for (let i = 0; i < talentSitemapCount; i++) {
      sitemaps.push({ id: currentId++ });
    }

    const skillsSitemapCount = calculateSitemapCount(skillsCount);
    for (let i = 0; i < skillsSitemapCount; i++) {
      sitemaps.push({ id: currentId++ });
    }

    const categoriesSitemapCount = calculateSitemapCount(categoriesCount);
    for (let i = 0; i < categoriesSitemapCount; i++) {
      sitemaps.push({ id: currentId++ });
    }

    const regionsSitemapCount = calculateSitemapCount(regionsCount);
    for (let i = 0; i < regionsSitemapCount; i++) {
      sitemaps.push({ id: currentId++ });
    }

    const opportunitiesSitemapCount = calculateSitemapCount(opportunitiesCount);
    for (let i = 0; i < opportunitiesSitemapCount; i++) {
      sitemaps.push({ id: currentId++ });
    }

    return sitemaps;
  } catch (error) {
    console.error('Error generating sitemap IDs:', error);
    return [];
  }
}

interface SitemapBoundaries {
  staticStart: number;
  staticEnd: number;
  listingsStart: number;
  listingsEnd: number;
  sponsorsStart: number;
  sponsorsEnd: number;
  grantsStart: number;
  grantsEnd: number;
  talentStart: number;
  talentEnd: number;
  skillsStart: number;
  skillsEnd: number;
  categoriesStart: number;
  categoriesEnd: number;
  regionsStart: number;
  regionsEnd: number;
  opportunitiesStart: number;
  opportunitiesEnd: number;
}

async function getSitemapBoundaries(): Promise<SitemapBoundaries> {
  const [
    staticRoutesCount,
    listingsCount,
    sponsorsCount,
    grantsCount,
    skillsCount,
    categoriesCount,
    regionsCount,
    talentCount,
    opportunitiesCount,
  ] = await Promise.all([
    getStaticRoutesCount(),
    getListingsCount(),
    getSponsorsCount(),
    getGrantsCount(),
    getSkillsCount(),
    getCategoriesCount(),
    getRegionsCount(),
    getTalentProfilesCount(),
    getOpportunitiesCount(),
  ]);

  const staticSitemapCount = calculateSitemapCount(staticRoutesCount);
  const listingsSitemapCount = calculateSitemapCount(listingsCount);
  const sponsorsSitemapCount = calculateSitemapCount(sponsorsCount);
  const grantsSitemapCount = calculateSitemapCount(grantsCount);
  const skillsSitemapCount = calculateSitemapCount(skillsCount);
  const categoriesSitemapCount = calculateSitemapCount(categoriesCount);
  const regionsSitemapCount = calculateSitemapCount(regionsCount);
  const talentSitemapCount = calculateSitemapCount(talentCount);
  const opportunitiesSitemapCount = calculateSitemapCount(opportunitiesCount);

  let currentId = 0;

  const staticStart = currentId;
  const staticEnd = currentId + staticSitemapCount;
  currentId = staticEnd;

  const listingsStart = currentId;
  const listingsEnd = currentId + listingsSitemapCount;
  currentId = listingsEnd;

  const sponsorsStart = currentId;
  const sponsorsEnd = currentId + sponsorsSitemapCount;
  currentId = sponsorsEnd;

  const grantsStart = currentId;
  const grantsEnd = currentId + grantsSitemapCount;
  currentId = grantsEnd;

  const talentStart = currentId;
  const talentEnd = currentId + talentSitemapCount;
  currentId = talentEnd;

  const skillsStart = currentId;
  const skillsEnd = currentId + skillsSitemapCount;
  currentId = skillsEnd;

  const categoriesStart = currentId;
  const categoriesEnd = currentId + categoriesSitemapCount;
  currentId = categoriesEnd;

  const regionsStart = currentId;
  const regionsEnd = currentId + regionsSitemapCount;
  currentId = regionsEnd;

  const opportunitiesStart = currentId;
  const opportunitiesEnd = currentId + opportunitiesSitemapCount;

  return {
    staticStart,
    staticEnd,
    listingsStart,
    listingsEnd,
    sponsorsStart,
    sponsorsEnd,
    grantsStart,
    grantsEnd,
    talentStart,
    talentEnd,
    skillsStart,
    skillsEnd,
    categoriesStart,
    categoriesEnd,
    regionsStart,
    regionsEnd,
    opportunitiesStart,
    opportunitiesEnd,
  };
}

export default async function sitemap(props: {
  id: Promise<string>;
}): Promise<MetadataRoute.Sitemap> {
  try {
    const now = new Date();

    if (!isProductionEnv()) {
      return [];
    }

    const id = await props.id;
    const sitemapId = Number.parseInt(id, 10);

    if (Number.isNaN(sitemapId)) {
      return [];
    }

    const boundaries = await getSitemapBoundaries();

    if (
      sitemapId >= boundaries.staticStart &&
      sitemapId < boundaries.staticEnd
    ) {
      const sitemapIndex = sitemapId - boundaries.staticStart;
      const offset = sitemapIndex * MAX_URLS_PER_SITEMAP;
      const staticRoutes = getStaticRoutes(now);

      return staticRoutes.slice(offset, offset + MAX_URLS_PER_SITEMAP);
    }

    if (
      sitemapId >= boundaries.listingsStart &&
      sitemapId < boundaries.listingsEnd
    ) {
      const sitemapIndex = sitemapId - boundaries.listingsStart;
      const offset = sitemapIndex * MAX_URLS_PER_SITEMAP;
      const listings = await prisma.bounties.findMany({
        where: {
          status: 'OPEN',
          isPublished: true,
          isActive: true,
          isPrivate: false,
        },
        select: {
          slug: true,
          deadline: true,
          updatedAt: true,
        },
        skip: offset,
        take: MAX_URLS_PER_SITEMAP,
        orderBy: {
          updatedAt: 'desc',
        },
      });

      return listings.map((listing): MetadataRoute.Sitemap[number] => ({
        url: `${baseUrl}/earn/listing/${listing.slug}/`,
        lastModified: listing.updatedAt,
        changeFrequency:
          listing.deadline && listing.deadline > now ? 'weekly' : 'monthly',
        priority: 0.9,
      }));
    }

    if (
      sitemapId >= boundaries.sponsorsStart &&
      sitemapId < boundaries.sponsorsEnd
    ) {
      const sitemapIndex = sitemapId - boundaries.sponsorsStart;
      const offset = sitemapIndex * MAX_URLS_PER_SITEMAP;
      const sponsors = await prisma.sponsors.findMany({
        where: {
          isActive: true,
          isArchived: false,
        },
        select: {
          slug: true,
          updatedAt: true,
        },
        skip: offset,
        take: MAX_URLS_PER_SITEMAP,
        orderBy: {
          updatedAt: 'desc',
        },
      });

      return sponsors.map((sponsor): MetadataRoute.Sitemap[number] => ({
        url: `${baseUrl}/earn/s/${sponsor.slug}/`,
        lastModified: sponsor.updatedAt,
        changeFrequency: 'weekly',
        priority: 0.7,
      }));
    }

    if (
      sitemapId >= boundaries.grantsStart &&
      sitemapId < boundaries.grantsEnd
    ) {
      const sitemapIndex = sitemapId - boundaries.grantsStart;
      const offset = sitemapIndex * MAX_URLS_PER_SITEMAP;
      const grants = await prisma.grants.findMany({
        where: {
          isPublished: true,
          isActive: true,
          isArchived: false,
          isPrivate: false,
        },
        select: {
          slug: true,
          updatedAt: true,
        },
        skip: offset,
        take: MAX_URLS_PER_SITEMAP,
        orderBy: {
          updatedAt: 'desc',
        },
      });

      return grants.map((grant): MetadataRoute.Sitemap[number] => ({
        url: `${baseUrl}/earn/grants/${grant.slug}/`,
        lastModified: grant.updatedAt,
        changeFrequency: 'monthly',
        priority: 0.8,
      }));
    }

    if (
      sitemapId >= boundaries.talentStart &&
      sitemapId < boundaries.talentEnd
    ) {
      const sitemapIndex = sitemapId - boundaries.talentStart;
      const offset = sitemapIndex * MAX_URLS_PER_SITEMAP;
      const talentProfiles = await prisma.user.findMany({
        where: {
          username: {
            not: null,
          },
          isTalentFilled: true,
          private: false,
          TalentRankings: {
            some: {
              totalEarnedInUSD: {
                gt: 0,
              },
            },
          },
        },
        select: {
          username: true,
          updatedAt: true,
        },
        skip: offset,
        take: MAX_URLS_PER_SITEMAP,
        orderBy: {
          updatedAt: 'desc',
        },
      });

      return talentProfiles.flatMap((talent) => {
        const username = talent.username?.trim();
        if (!username) return [];
        return [
          {
            url: `${baseUrl}/earn/t/${username}/`,
            lastModified: talent.updatedAt,
            changeFrequency: 'monthly' as const,
            priority: 0.6,
          },
        ];
      });
    }

    if (
      sitemapId >= boundaries.skillsStart &&
      sitemapId < boundaries.skillsEnd
    ) {
      const sitemapIndex = sitemapId - boundaries.skillsStart;
      const offset = sitemapIndex * MAX_URLS_PER_SITEMAP;
      const allSkillSlugs = getAllSkillSlugs();

      if (allSkillSlugs.length === 0) {
        return [];
      }

      const skillSlugs = allSkillSlugs.slice(
        offset,
        offset + MAX_URLS_PER_SITEMAP,
      );

      return skillSlugs.map((slug): MetadataRoute.Sitemap[number] => ({
        url: `${baseUrl}/earn/skill/${slug}/`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.7,
      }));
    }

    if (
      sitemapId >= boundaries.categoriesStart &&
      sitemapId < boundaries.categoriesEnd
    ) {
      const sitemapIndex = sitemapId - boundaries.categoriesStart;
      const offset = sitemapIndex * MAX_URLS_PER_SITEMAP;
      const allCategorySlugs = getAllCategorySlugs();

      if (allCategorySlugs.length === 0) {
        return [];
      }

      const categorySlugs = allCategorySlugs.slice(
        offset,
        offset + MAX_URLS_PER_SITEMAP,
      );

      return categorySlugs.map((slug): MetadataRoute.Sitemap[number] => ({
        url: `${baseUrl}/earn/category/${slug}/`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.8,
      }));
    }

    if (
      sitemapId >= boundaries.regionsStart &&
      sitemapId < boundaries.regionsEnd
    ) {
      const sitemapIndex = sitemapId - boundaries.regionsStart;
      const offset = sitemapIndex * MAX_URLS_PER_SITEMAP;
      const allRegionSlugs = await getRegionSlugsForSitemap();

      if (allRegionSlugs.length === 0) {
        return [];
      }

      const regionSlugs = allRegionSlugs.slice(
        offset,
        offset + MAX_URLS_PER_SITEMAP,
      );

      return regionSlugs.map((slug): MetadataRoute.Sitemap[number] => ({
        url: `${baseUrl}/earn/regions/${slug}/`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.8,
      }));
    }

    if (
      sitemapId >= boundaries.opportunitiesStart &&
      sitemapId < boundaries.opportunitiesEnd
    ) {
      const sitemapIndex = sitemapId - boundaries.opportunitiesStart;
      const offset = sitemapIndex * MAX_URLS_PER_SITEMAP;
      const allCombinations = await generateOpportunityCombinations();

      if (allCombinations.length === 0) {
        return [];
      }

      const combinations = allCombinations.slice(
        offset,
        offset + MAX_URLS_PER_SITEMAP,
      );

      return combinations.map((slug): MetadataRoute.Sitemap[number] => ({
        url: `${baseUrl}/earn/opportunities/${slug}/`,
        lastModified: now,
        changeFrequency: 'daily',
        priority: 0.7,
      }));
    }

    return [];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return [];
  }
}
