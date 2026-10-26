// Earn's region rules, as pure functions of its active chapters. Two
// families, both kept as Earn has them:
// - the list pages' (utils/chapterRegion.ts): which `region` values a
//   person, a chapter page or a country page sees;
// - the "combined region" lookups (features/listings/utils/region.ts) that
//   live listings, live grants, hackathon lists and search use.
import { countries } from '@/constants/country';

export interface ChapterRegion {
  readonly id: string;
  readonly name: string;
  readonly region: string;
  readonly displayValue: string;
  readonly slug: string;
  readonly code: string;
  readonly country: ReadonlyArray<string>;
  readonly banner: string | null;
  readonly icons: string | null;
  readonly link: string | null;
  readonly hello: string | null;
  readonly nationality: string | null;
}

type Chapters = ReadonlyArray<ChapterRegion>;

const normalize = (value: string | null | undefined): string =>
  (value || '').trim().toLowerCase();

const isMultiCountry = (
  country: (typeof countries)[number],
): country is (typeof countries)[number] & {
  region: true;
  regions: string[];
} =>
  'region' in country &&
  !!country.region &&
  'regions' in country &&
  Array.isArray(country.regions);

const MULTI_COUNTRY = countries.filter(isMultiCountry);

function findChapterByLocation(
  chapters: Chapters,
  location: string | null | undefined,
): ChapterRegion | null {
  const wanted = normalize(location);
  if (!wanted) return null;
  return (
    chapters.find(
      (chapter) =>
        normalize(chapter.region) === wanted ||
        normalize(chapter.displayValue) === wanted ||
        normalize(chapter.name) === wanted ||
        chapter.country.some((country) => normalize(country) === wanted),
    ) ?? null
  );
}

export function findChapterByRegionInput(
  chapters: Chapters,
  region: string,
): ChapterRegion | null {
  const wanted = normalize(region);
  if (!wanted) return null;
  return (
    chapters.find(
      (chapter) =>
        normalize(chapter.region) === wanted ||
        normalize(chapter.displayValue) === wanted ||
        normalize(chapter.slug) === wanted ||
        normalize(chapter.name) === wanted,
    ) ?? null
  );
}

export function regionsForChapterPage(
  chapters: Chapters,
  chapterRegion: string,
): string[] {
  const chapter = findChapterByRegionInput(chapters, chapterRegion);
  if (!chapter) return ['Global'];
  const regions: string[] = [chapter.region, ...chapter.country, 'Global'];
  if (chapter.country.length > 0) {
    const single = chapter.country.length === 1;
    regions.push(
      ...MULTI_COUNTRY.filter((country) =>
        single
          ? !!chapter.country[0] && country.regions.includes(chapter.country[0])
          : chapter.country.every((name) => country.regions.includes(name)),
      ).map((country) => country.name),
    );
  }
  return Array.from(new Set(regions));
}

export function regionsForMultiCountryRegionPage(
  chapters: Chapters,
  regionName: string,
): string[] {
  const country = MULTI_COUNTRY.find(
    (item) => normalize(item.name) === normalize(regionName),
  );
  if (!country) return ['Global'];
  const regions: string[] = [country.name, ...country.regions, 'Global'];
  regions.push(
    ...chapters
      .filter((chapter) =>
        chapter.country.length === 1
          ? !!chapter.country[0] && country.regions.includes(chapter.country[0])
          : chapter.country.every((name) => country.regions.includes(name)),
      )
      .map((chapter) => chapter.region),
  );
  return Array.from(new Set(regions));
}

export function regionsForCountryPage(
  chapters: Chapters,
  countryName: string,
): string[] {
  const regions: string[] = [countryName, 'Global'];
  regions.push(
    ...MULTI_COUNTRY.filter((country) =>
      country.regions.includes(countryName),
    ).map((country) => country.name),
  );
  regions.push(
    ...chapters
      .filter((chapter) => chapter.country.includes(countryName))
      .map((chapter) => chapter.region),
  );
  return Array.from(new Set(regions));
}

// The `region` values a talent in `location` sees on the home and "all"
// lists. Outside every chapter, only Global ones (as Earn has it).
export function regionsForUserLocation(
  chapters: Chapters,
  location: string | null,
): string[] {
  if (!location) return ['Global'];
  const chapter = findChapterByLocation(chapters, location);
  if (!chapter) return ['Global'];
  const wanted = normalize(location);
  const regions: string[] = ['Global', location, chapter.region];
  regions.push(
    ...MULTI_COUNTRY.filter((country) =>
      country.regions.some((name) => normalize(name) === wanted),
    ).map((country) => country.name),
  );
  regions.push(
    ...chapters
      .filter((item) => item.country.some((name) => normalize(name) === wanted))
      .map((item) => item.region),
  );
  return Array.from(new Set(regions));
}

// What a list page's `region` parameter covers: a chapter (its regions, or
// anything its own sponsor posts), a country or multi-country region, or
// failing those the capitalised word and Global.
export type RegionScope =
  | {
      readonly kind: 'chapter';
      readonly regions: string[];
      readonly sponsorName: string;
    }
  | { readonly kind: 'regions'; readonly regions: string[] };

export function regionScope(chapters: Chapters, region: string): RegionScope {
  const chapter = findChapterByRegionInput(chapters, region);
  if (chapter) {
    return {
      kind: 'chapter',
      regions: regionsForChapterPage(chapters, chapter.region),
      sponsorName: chapter.name,
    };
  }
  const country = countries.find(
    (item) => item.name.toLowerCase() === region.toLowerCase(),
  );
  if (country) {
    return {
      kind: 'regions',
      regions: isMultiCountry(country)
        ? regionsForMultiCountryRegionPage(chapters, country.name)
        : regionsForCountryPage(chapters, country.name),
    };
  }
  return {
    kind: 'regions',
    regions: [region.charAt(0).toUpperCase() + region.slice(1), 'Global'],
  };
}

interface CombinedRegion {
  readonly name?: string;
  readonly region?: string;
  readonly code: string;
  readonly country?: ReadonlyArray<string>;
  readonly displayValue?: string;
  readonly regions?: ReadonlyArray<string>;
}

// features/listings/utils/region.ts getCombinedRegion with
// lookupSTCountries: a chapter covering the location, else one named like
// it, else a country.
function combinedRegion(
  chapters: Chapters,
  location: string,
): CombinedRegion | undefined {
  const wanted = normalize(location);
  if (!wanted) return undefined;
  const chapter =
    chapters.find((item) =>
      item.country.some((country) => normalize(country) === wanted),
    ) ??
    chapters.find(
      (item) =>
        normalize(item.region) === wanted ||
        normalize(item.displayValue) === wanted ||
        normalize(item.name) === wanted ||
        normalize(item.slug) === wanted,
    );
  if (chapter) {
    return {
      ...chapter,
      name: chapter.displayValue ? chapter.displayValue : chapter.name,
    };
  }
  const country = countries.find(
    (item) =>
      normalize(item.name) === wanted ||
      ('displayValue' in item && normalize(item.displayValue) === wanted),
  );
  if (!country) return undefined;
  return {
    name: country.name,
    code: country.code,
    displayValue: 'displayValue' in country ? country.displayValue : undefined,
    regions: 'regions' in country ? country.regions : undefined,
  };
}

// The `region` values open to someone in `location`, by the combined
// lookup: Global, their region, the country itself when the region is a
// chapter covering it, and multi-country regions listing the region.
export function combinedRegionsFor(
  chapters: Chapters,
  location: string,
): string[] {
  const matched = combinedRegion(chapters, location);
  if (!matched?.name) return ['Global'];
  const name = matched.name.toLowerCase();
  return [
    'Global',
    matched.name,
    ...(matched.country ?? []).filter(
      (country) => country.toLowerCase() === location.toLowerCase(),
    ),
    ...countries
      .filter(
        (country) =>
          'regions' in country &&
          country.regions?.some((item) => item.toLowerCase() === name),
      )
      .map((country) => country.name),
  ];
}
