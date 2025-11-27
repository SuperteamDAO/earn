import type { MetadataRoute } from 'next';

import { prisma } from '@/prisma';

import { getAllCategorySlugs } from '@/features/listings/utils/category';
import { getAllRegionSlugs } from '@/features/listings/utils/region';
import { getAllSkillSlugs } from '@/features/listings/utils/skill';

const baseUrl = 'https://earn.superteam.fun';
const MAX_URLS_PER_SITEMAP = 50000;

export const revalidate = 86400; // 1 day

function isProduction(): boolean {
  return process.env.NEXT_PUBLIC_VERCEL_ENV === 'production';
}

// Sitemap organization:
// /sitemap.xml: Static routes (handled by sitemap.xml/route.ts)
// ID 0+: Listings (split if > 50k)
// Next IDs: Sponsors (split if > 50k)
// Next IDs: Grants (split if > 50k)
// Next IDs: Talent profiles (split if > 50k)
// Next IDs: Skills (split if > 50k)
// Next IDs: Categories (split if > 50k)
// Last ID: Regions

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
  return getAllRegionSlugs().length;
}

async function getSkillsCount(): Promise<number> {
  return getAllSkillSlugs().length;
}

async function getCategoriesCount(): Promise<number> {
  return getAllCategorySlugs().length;
}

// Talent profiles
async function getTalentProfilesCount(): Promise<number> {
  return await prisma.user.count({
    where: {
      username: {
        not: null,
      },
      isTalentFilled: true,
      private: false,
    },
  });
}

function calculateSitemapCount(totalCount: number): number {
  return Math.max(1, Math.ceil(totalCount / MAX_URLS_PER_SITEMAP));
}

export async function generateSitemaps(): Promise<Array<{ id: number }>> {
  // Only generate sitemaps in production
  if (!isProduction()) {
    return []; // Return empty for non-production
  }

  const [
    listingsCount,
    sponsorsCount,
    grantsCount,
    regionsCount,
    skillsCount,
    categoriesCount,
    talentCount,
  ] = await Promise.all([
    getListingsCount(),
    getSponsorsCount(),
    getGrantsCount(),
    getRegionsCount(),
    getSkillsCount(),
    getCategoriesCount(),
    getTalentProfilesCount(),
  ]);

  const sitemaps: Array<{ id: number }> = [];

  // Start from ID 0 for dynamic sitemaps
  let currentId = 0;

  // Listings - split if needed
  const listingsSitemapCount = calculateSitemapCount(listingsCount);
  for (let i = 0; i < listingsSitemapCount; i++) {
    sitemaps.push({ id: currentId++ });
  }

  // Sponsors - split if needed
  const sponsorsSitemapCount = calculateSitemapCount(sponsorsCount);
  for (let i = 0; i < sponsorsSitemapCount; i++) {
    sitemaps.push({ id: currentId++ });
  }

  // Grants - split if needed
  const grantsSitemapCount = calculateSitemapCount(grantsCount);
  for (let i = 0; i < grantsSitemapCount; i++) {
    sitemaps.push({ id: currentId++ });
  }

  // Talent profiles - split if needed
  const talentSitemapCount = calculateSitemapCount(talentCount);
  for (let i = 0; i < talentSitemapCount; i++) {
    sitemaps.push({ id: currentId++ });
  }

  // Skills - split if needed
  const skillsSitemapCount = calculateSitemapCount(skillsCount);
  for (let i = 0; i < skillsSitemapCount; i++) {
    sitemaps.push({ id: currentId++ });
  }

  // Categories - split if needed
  const categoriesSitemapCount = calculateSitemapCount(categoriesCount);
  for (let i = 0; i < categoriesSitemapCount; i++) {
    sitemaps.push({ id: currentId++ });
  }

  // Regions - split if needed
  const regionsSitemapCount = calculateSitemapCount(regionsCount);
  for (let i = 0; i < regionsSitemapCount; i++) {
    sitemaps.push({ id: currentId++ });
  }

  return sitemaps;
}

interface SitemapBoundaries {
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
}

async function getSitemapBoundaries(): Promise<SitemapBoundaries> {
  const [
    listingsCount,
    sponsorsCount,
    grantsCount,
    skillsCount,
    categoriesCount,
    regionsCount,
    talentCount,
  ] = await Promise.all([
    getListingsCount(),
    getSponsorsCount(),
    getGrantsCount(),
    getSkillsCount(),
    getCategoriesCount(),
    getRegionsCount(),
    getTalentProfilesCount(),
  ]);

  const listingsSitemapCount = calculateSitemapCount(listingsCount);
  const sponsorsSitemapCount = calculateSitemapCount(sponsorsCount);
  const grantsSitemapCount = calculateSitemapCount(grantsCount);
  const skillsSitemapCount = calculateSitemapCount(skillsCount);
  const categoriesSitemapCount = calculateSitemapCount(categoriesCount);
  const regionsSitemapCount = calculateSitemapCount(regionsCount);
  const talentSitemapCount = calculateSitemapCount(talentCount);

  // Start from ID 0 for dynamic sitemaps
  let currentId = 0;

  const listingsStart = currentId;
  const listingsEnd = currentId + listingsSitemapCount;
  currentId = listingsEnd;

  const sponsorsStart = currentId;
  const sponsorsEnd = currentId + sponsorsSitemapCount;
  currentId = sponsorsEnd;

  const grantsStart = currentId;
  const grantsEnd = currentId + grantsSitemapCount;
  currentId = grantsEnd;

  // Talent profiles
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

  return {
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
  };
}

export default async function sitemap(props: {
  id: Promise<number>;
}): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Only generate dynamic sitemaps in production
  if (!isProduction()) {
    return [];
  }

  const id = await props.id;
  const sitemapId = typeof id === 'string' ? parseInt(id, 10) : id;

  const boundaries = await getSitemapBoundaries();

  // Listings
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
      url: `${baseUrl}/listing/${listing.slug}/`,
      lastModified: listing.updatedAt,
      changeFrequency:
        listing.deadline && listing.deadline > now ? 'weekly' : 'monthly',
      priority: 0.9,
    }));
  }

  // Sponsors
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
      url: `${baseUrl}/s/${sponsor.slug}/`,
      lastModified: sponsor.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.7,
    }));
  }

  // Grants
  if (sitemapId >= boundaries.grantsStart && sitemapId < boundaries.grantsEnd) {
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
      url: `${baseUrl}/grants/${grant.slug}/`,
      lastModified: grant.updatedAt,
      changeFrequency: 'monthly',
      priority: 0.8,
    }));
  }

  // Talent profiles
  if (sitemapId >= boundaries.talentStart && sitemapId < boundaries.talentEnd) {
    const sitemapIndex = sitemapId - boundaries.talentStart;
    const offset = sitemapIndex * MAX_URLS_PER_SITEMAP;
    const talentProfiles = await prisma.user.findMany({
      where: {
        username: {
          not: null,
        },
        isTalentFilled: true,
        private: false,
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

    return talentProfiles
      .filter((talent) => talent.username)
      .map((talent) => ({
        url: `${baseUrl}/t/${talent.username}/`,
        lastModified: talent.updatedAt,
        changeFrequency: 'monthly',
        priority: 0.6,
      }));
  }

  // Skills
  if (sitemapId >= boundaries.skillsStart && sitemapId < boundaries.skillsEnd) {
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
      url: `${baseUrl}/skill/${slug}/`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    }));
  }

  // Categories
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
      url: `${baseUrl}/category/${slug}/`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    }));
  }

  // Regions
  if (
    sitemapId >= boundaries.regionsStart &&
    sitemapId < boundaries.regionsEnd
  ) {
    const sitemapIndex = sitemapId - boundaries.regionsStart;
    const offset = sitemapIndex * MAX_URLS_PER_SITEMAP;
    const allRegionSlugs = getAllRegionSlugs();

    if (allRegionSlugs.length === 0) {
      return [];
    }

    const regionSlugs = allRegionSlugs.slice(
      offset,
      offset + MAX_URLS_PER_SITEMAP,
    );

    return regionSlugs.map((slug): MetadataRoute.Sitemap[number] => ({
      url: `${baseUrl}/regions/${slug}/`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    }));
  }

  return [];
}
