import type { MetadataRoute } from 'next';

import { Superteams } from '@/constants/Superteam';
import { prisma } from '@/prisma';

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
// Next IDs: Talent profiles (split if > 50k) - COMMENTED OUT
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

// COMMENTED OUT: Talent profiles - will decide later if we want this
// async function getTalentProfilesCount(): Promise<number> {
//   return await prisma.user.count({
//     where: {
//       username: {
//         not: null,
//       },
//       isTalentFilled: true,
//       private: false,
//     },
//   });
// }

function calculateSitemapCount(totalCount: number): number {
  return Math.max(1, Math.ceil(totalCount / MAX_URLS_PER_SITEMAP));
}

export async function generateSitemaps(): Promise<Array<{ id: number }>> {
  // Only generate sitemaps in production
  if (!isProduction()) {
    return []; // Return empty for non-production
  }

  const [listingsCount, sponsorsCount, grantsCount] = await Promise.all([
    getListingsCount(),
    getSponsorsCount(),
    getGrantsCount(),
    // getTalentProfilesCount(), // COMMENTED OUT: Talent profiles
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

  // COMMENTED OUT: Talent profiles - split if needed
  // const talentSitemapCount = calculateSitemapCount(talentCount);
  // for (let i = 0; i < talentSitemapCount; i++) {
  //   sitemaps.push({ id: currentId++ });
  // }

  // Regions - always 1 sitemap (only ~30 regions)
  sitemaps.push({ id: currentId });

  return sitemaps;
}

interface SitemapBoundaries {
  listingsStart: number;
  listingsEnd: number;
  sponsorsStart: number;
  sponsorsEnd: number;
  grantsStart: number;
  grantsEnd: number;
  // talentStart: number; // COMMENTED OUT: Talent profiles
  // talentEnd: number; // COMMENTED OUT: Talent profiles
  regionsId: number;
}

async function getSitemapBoundaries(): Promise<SitemapBoundaries> {
  const [listingsCount, sponsorsCount, grantsCount] = await Promise.all([
    getListingsCount(),
    getSponsorsCount(),
    getGrantsCount(),
    // getTalentProfilesCount(), // COMMENTED OUT: Talent profiles
  ]);

  const listingsSitemapCount = calculateSitemapCount(listingsCount);
  const sponsorsSitemapCount = calculateSitemapCount(sponsorsCount);
  const grantsSitemapCount = calculateSitemapCount(grantsCount);
  // const talentSitemapCount = calculateSitemapCount(talentCount); // COMMENTED OUT: Talent profiles

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

  // COMMENTED OUT: Talent profiles
  // const talentStart = currentId;
  // const talentEnd = currentId + talentSitemapCount;
  // currentId = talentEnd;

  const regionsId = currentId;

  return {
    listingsStart,
    listingsEnd,
    sponsorsStart,
    sponsorsEnd,
    grantsStart,
    grantsEnd,
    // talentStart, // COMMENTED OUT: Talent profiles
    // talentEnd, // COMMENTED OUT: Talent profiles
    regionsId,
  };
}

export default async function sitemap({
  id,
}: {
  id: number;
}): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Only generate dynamic sitemaps in production
  if (!isProduction()) {
    return [];
  }

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

  // COMMENTED OUT: Talent profiles - will decide later if we want this
  // if (id >= boundaries.talentStart && id < boundaries.talentEnd) {
  //   const sitemapIndex = id - boundaries.talentStart;
  //   const offset = sitemapIndex * MAX_URLS_PER_SITEMAP;
  //   const talentProfiles = await prisma.user.findMany({
  //     where: {
  //       username: {
  //         not: null,
  //       },
  //       isTalentFilled: true,
  //       private: false,
  //     },
  //     select: {
  //       username: true,
  //       updatedAt: true,
  //     },
  //     skip: offset,
  //     take: MAX_URLS_PER_SITEMAP,
  //     orderBy: {
  //       updatedAt: 'desc',
  //     },
  //   });
  //
  //   return talentProfiles
  //     .filter((talent) => talent.username)
  //     .map((talent) => ({
  //       url: `${baseUrl}/t/${talent.username}/`,
  //       lastModified: talent.updatedAt,
  //       changeFrequency: 'monthly',
  //       priority: 0.6,
  //     }));
  // }

  // Regions
  if (sitemapId === boundaries.regionsId) {
    const regionsWithSlugs = Superteams.filter(
      (region) => region?.slug && typeof region.slug === 'string',
    );

    if (regionsWithSlugs.length === 0) {
      return [];
    }

    return regionsWithSlugs.map((region): MetadataRoute.Sitemap[number] => ({
      url: `${baseUrl}/regions/${region.slug}/`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    }));
  }

  return [];
}
