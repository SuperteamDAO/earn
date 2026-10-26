import type { MetadataRoute } from 'next';

import { getSiteUrl, isProductionEnv } from '@/lib/site-url';
import { prisma } from '@/prisma';
import { getChapterRegions } from '@/utils/chapterRegion';

import { getAllCategorySlugs } from '@/features/listings/utils/category';
import { getAllRegionSlugs } from '@/features/listings/utils/region';

const baseUrl = getSiteUrl();
const MAX_URLS_PER_SITEMAP = 50000;

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
      type: { in: ['bounty', 'hackathon'] },
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

async function getRegionSlugsForSitemap(): Promise<readonly string[]> {
  if (cachedRegionSlugs) {
    return cachedRegionSlugs;
  }

  const chapterRegions = await getChapterRegions();
  cachedRegionSlugs = getAllRegionSlugs(chapterRegions);
  return cachedRegionSlugs;
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
      categoriesCount,
      talentCount,
    ] = await Promise.all([
      getStaticRoutesCount(),
      getListingsCount(),
      getSponsorsCount(),
      getGrantsCount(),
      getRegionsCount(),
      getCategoriesCount(),
      getTalentProfilesCount(),
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

    const categoriesSitemapCount = calculateSitemapCount(categoriesCount);
    for (let i = 0; i < categoriesSitemapCount; i++) {
      sitemaps.push({ id: currentId++ });
    }

    const regionsSitemapCount = calculateSitemapCount(regionsCount);
    for (let i = 0; i < regionsSitemapCount; i++) {
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
  categoriesStart: number;
  categoriesEnd: number;
  regionsStart: number;
  regionsEnd: number;
}

async function getSitemapBoundaries(): Promise<SitemapBoundaries> {
  const [
    staticRoutesCount,
    listingsCount,
    sponsorsCount,
    grantsCount,
    categoriesCount,
    regionsCount,
    talentCount,
  ] = await Promise.all([
    getStaticRoutesCount(),
    getListingsCount(),
    getSponsorsCount(),
    getGrantsCount(),
    getCategoriesCount(),
    getRegionsCount(),
    getTalentProfilesCount(),
  ]);

  const staticSitemapCount = calculateSitemapCount(staticRoutesCount);
  const listingsSitemapCount = calculateSitemapCount(listingsCount);
  const sponsorsSitemapCount = calculateSitemapCount(sponsorsCount);
  const grantsSitemapCount = calculateSitemapCount(grantsCount);
  const categoriesSitemapCount = calculateSitemapCount(categoriesCount);
  const regionsSitemapCount = calculateSitemapCount(regionsCount);
  const talentSitemapCount = calculateSitemapCount(talentCount);

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

  const categoriesStart = currentId;
  const categoriesEnd = currentId + categoriesSitemapCount;
  currentId = categoriesEnd;

  const regionsStart = currentId;
  const regionsEnd = currentId + regionsSitemapCount;

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
    categoriesStart,
    categoriesEnd,
    regionsStart,
    regionsEnd,
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
          type: { in: ['bounty', 'hackathon'] },
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

    return [];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return [];
  }
}
