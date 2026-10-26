import { prisma } from '@/prisma';

export type ChapterRegion = {
  id: string;
  name: string;
  region: string;
  displayValue: string;
  slug: string;
  code: string;
  country: string[];
  banner: string | null;
  icons: string | null;
  link: string | null;
  hello: string | null;
  nationality: string | null;
};

const CACHE_TTL_MS = 5 * 60 * 1000;
let cachedChapterRegions: ChapterRegion[] | null = null;
let lastFetchedAt = 0;

function parseCountries(rawCountries: unknown): string[] {
  if (!Array.isArray(rawCountries)) {
    return [];
  }
  return rawCountries.filter(
    (country): country is string => typeof country === 'string',
  );
}

function normalize(value: string | null | undefined): string {
  return (value || '').trim().toLowerCase();
}

async function getChapterRegions(): Promise<ChapterRegion[]> {
  if (cachedChapterRegions && Date.now() - lastFetchedAt < CACHE_TTL_MS) {
    return cachedChapterRegions;
  }

  const chapters = await prisma.chapter.findMany({
    where: { active: true },
    select: {
      id: true,
      name: true,
      region: true,
      displayValue: true,
      slug: true,
      code: true,
      countries: true,
      banner: true,
      icons: true,
      link: true,
      hello: true,
      nationality: true,
    },
  });

  cachedChapterRegions = chapters.map((chapter) => ({
    id: chapter.id,
    name: chapter.name,
    region: chapter.region,
    displayValue: chapter.displayValue || chapter.region,
    slug: chapter.slug,
    code: chapter.code || '',
    country: parseCountries(chapter.countries),
    banner: chapter.banner,
    icons: chapter.icons,
    link: chapter.link,
    hello: chapter.hello,
    nationality: chapter.nationality,
  }));
  lastFetchedAt = Date.now();

  return cachedChapterRegions;
}

export async function findChapterByRegionInput(
  region: string,
): Promise<ChapterRegion | null> {
  const normalizedRegion = normalize(region);
  if (!normalizedRegion) {
    return null;
  }

  const chapterRegions = await getChapterRegions();
  return (
    chapterRegions.find(
      (chapter) =>
        normalize(chapter.region) === normalizedRegion ||
        normalize(chapter.displayValue) === normalizedRegion ||
        normalize(chapter.slug) === normalizedRegion ||
        normalize(chapter.name) === normalizedRegion,
    ) || null
  );
}
