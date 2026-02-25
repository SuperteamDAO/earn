import { countries } from '@/constants/country';
import { prisma } from '@/prisma';

export type ChapterRegion = {
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

export async function getChapterRegions(): Promise<ChapterRegion[]> {
  if (cachedChapterRegions && Date.now() - lastFetchedAt < CACHE_TTL_MS) {
    return cachedChapterRegions;
  }

  const chapters = await prisma.chapter.findMany({
    select: {
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

async function findChapterByLocation(
  location: string | null | undefined,
): Promise<ChapterRegion | null> {
  const normalizedLocation = normalize(location);
  if (!normalizedLocation) {
    return null;
  }

  const chapterRegions = await getChapterRegions();
  return (
    chapterRegions.find((chapter) => {
      if (
        normalize(chapter.region) === normalizedLocation ||
        normalize(chapter.displayValue) === normalizedLocation ||
        normalize(chapter.name) === normalizedLocation
      ) {
        return true;
      }

      return chapter.country.some(
        (country) => normalize(country) === normalizedLocation,
      );
    }) || null
  );
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

export async function getRegionNameForLocation(
  location: string | null | undefined,
): Promise<string> {
  const chapter = await findChapterByLocation(location);
  return chapter?.region || 'Global';
}

function getMultiCountryRegionsContainingCountry(
  countryName: string,
  chapterRegions: ChapterRegion[],
): string[] {
  const regions: string[] = [];

  const regionsFromCountries = countries
    .filter(
      (country) =>
        country.region &&
        country.regions &&
        Array.isArray(country.regions) &&
        country.regions.includes(countryName),
    )
    .map((country) => country.name);
  regions.push(...regionsFromCountries);

  const regionsFromChapters = chapterRegions
    .filter((chapter) => chapter.country.includes(countryName))
    .map((chapter) => chapter.region);
  regions.push(...regionsFromChapters);

  return regions;
}

function getChapterRegionsContainingCountries(
  countryNames: string[],
  chapterRegions: ChapterRegion[],
): string[] {
  return chapterRegions
    .filter((chapter) => {
      const isSingleCountryChapter = chapter.country.length === 1;
      if (isSingleCountryChapter) {
        const singleCountry = chapter.country[0];
        return singleCountry ? countryNames.includes(singleCountry) : false;
      }

      return chapter.country.every((countryName) =>
        countryNames.includes(countryName),
      );
    })
    .map((chapter) => chapter.region);
}

export async function getRegionsForChapterPage(
  chapterRegion: string,
): Promise<string[]> {
  const chapter = await findChapterByRegionInput(chapterRegion);
  if (!chapter) return ['Global'];

  const regions: string[] = [chapter.region, ...chapter.country, 'Global'];

  if (chapter.country.length > 0) {
    const isSingleCountryChapter = chapter.country.length === 1;
    const multiCountryRegions = countries
      .filter(
        (country) =>
          country.region &&
          country.regions &&
          Array.isArray(country.regions) &&
          (isSingleCountryChapter
            ? chapter.country[0] && country.regions.includes(chapter.country[0])
            : chapter.country.every((countryName) =>
                country.regions.includes(countryName),
              )),
      )
      .map((country) => country.name);
    regions.push(...multiCountryRegions);
  }

  return Array.from(new Set(regions));
}

export async function getRegionsForMultiCountryRegionPageUsingChapters(
  regionName: string,
): Promise<string[]> {
  const country = countries.find(
    (item) => normalize(item.name) === normalize(regionName),
  );

  if (!country?.region || !country.regions || !Array.isArray(country.regions)) {
    return ['Global'];
  }

  const chapterRegions = await getChapterRegions();
  const regions: string[] = [country.name, ...country.regions, 'Global'];

  const chapterBackedRegions = getChapterRegionsContainingCountries(
    country.regions,
    chapterRegions,
  );
  regions.push(...chapterBackedRegions);

  return Array.from(new Set(regions));
}

export async function getRegionsForCountryPageUsingChapters(
  countryName: string,
): Promise<string[]> {
  const chapterRegions = await getChapterRegions();
  const regions: string[] = [countryName, 'Global'];

  const multiCountryRegions = getMultiCountryRegionsContainingCountry(
    countryName,
    chapterRegions,
  );
  regions.push(...multiCountryRegions);

  return Array.from(new Set(regions));
}

export async function getRegionsForUserLocationUsingChapters(
  userLocation: string | null,
): Promise<string[]> {
  if (!userLocation) return ['Global'];

  const chapterRegions = await getChapterRegions();
  const chapter = await findChapterByLocation(userLocation);
  if (!chapter) return ['Global'];

  const regions: string[] = ['Global', userLocation, chapter.region];

  const multiCountryRegionsFromCountries = countries
    .filter(
      (country) =>
        country.region &&
        country.regions &&
        Array.isArray(country.regions) &&
        country.regions.some(
          (countryName) => normalize(countryName) === normalize(userLocation),
        ),
    )
    .map((country) => country.name);
  regions.push(...multiCountryRegionsFromCountries);

  const multiCountryRegionsFromChapters = chapterRegions
    .filter((item) =>
      item.country.some(
        (countryName) => normalize(countryName) === normalize(userLocation),
      ),
    )
    .map((item) => item.region);
  regions.push(...multiCountryRegionsFromChapters);

  return Array.from(new Set(regions));
}
