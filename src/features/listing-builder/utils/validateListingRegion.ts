import { countries } from '@/constants/country';
import { canonicalizeRegionValue } from '@/utils/canonicalRegion';
import { getChapterRegions } from '@/utils/chapterRegion';

const normalizeRegion = (value: string) => value.trim().toLowerCase();

export async function getAllowedListingRegions() {
  const chapters = await getChapterRegions();
  const chapterCountryCodes = new Set(
    chapters.map((chapter) => chapter.code.toLowerCase()).filter(Boolean),
  );

  return new Set([
    'Global',
    ...chapters.map((chapter) => chapter.region),
    ...countries
      .filter((country) => country.iso)
      .filter((country) => !chapterCountryCodes.has(country.code.toLowerCase()))
      .map((country) => country.name),
    ...countries
      .filter((country) => country.region)
      .map((country) => country.name),
  ]);
}

export async function getValidListingRegion(value?: string | null) {
  const canonicalRegion = canonicalizeRegionValue(value || 'Global');
  const allowedRegions = await getAllowedListingRegions();
  const normalizedAllowedRegions = new Map(
    [...allowedRegions].map((region) => [normalizeRegion(region), region]),
  );

  return normalizedAllowedRegions.get(normalizeRegion(canonicalRegion)) || null;
}
