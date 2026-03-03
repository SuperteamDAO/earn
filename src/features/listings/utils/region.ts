import lookup from 'country-code-lookup';

import { countries } from '@/constants/country';
import type { ChapterRegionData } from '@/interface/chapter';

function normalizeRegionValue(value: string | null | undefined): string {
  return (value || '').trim().toLowerCase();
}

function isChapterRegionMatch(
  chapter: ChapterRegionData,
  normalizedRegion: string,
): boolean {
  return (
    normalizeRegionValue(chapter.region) === normalizedRegion ||
    normalizeRegionValue(chapter.displayValue) === normalizedRegion ||
    normalizeRegionValue(chapter.name) === normalizedRegion ||
    normalizeRegionValue(chapter.slug) === normalizedRegion
  );
}

export const getCombinedRegion = (
  region: string,
  lookupSTCountries: boolean = false,
  chapters: ChapterRegionData[] = [],
) => {
  let regionObject:
    | {
        name?: string;
        region?: string;
        code: string;
        country?: string[];
        displayValue?: string;
        slug?: string;
        regions?: string[];
      }
    | undefined;
  const normalizedRegion = normalizeRegionValue(region);
  if (!normalizedRegion) {
    return undefined;
  }

  if (lookupSTCountries) {
    regionObject = chapters.find((chapter) =>
      chapter.country.some(
        (country) => normalizeRegionValue(country) === normalizedRegion,
      ),
    );
  }

  if (!regionObject) {
    regionObject = chapters.find((chapter) =>
      isChapterRegionMatch(chapter, normalizedRegion),
    );
  }

  if (!regionObject) {
    regionObject = chapters.find((chapter) =>
      chapter.country.some(
        (country) => normalizeRegionValue(country) === normalizedRegion,
      ),
    );
  }

  if (regionObject?.displayValue) {
    regionObject = {
      ...regionObject,
      name: regionObject.displayValue,
    };
  }

  return regionObject;
};

export const getParentRegions = (
  region: ReturnType<typeof getCombinedRegion>,
) => {
  return countries
    .filter((s) =>
      s.regions?.find((s) => s.toLowerCase() === region?.name?.toLowerCase()),
    )
    .map((s) => s.name);
};

export const filterRegionCountry = (
  region: ReturnType<typeof getCombinedRegion>,
  country: string,
) => {
  if (country === 'UK' || country === 'United Kingdom') {
    return {
      ...region,
      country:
        region?.country?.filter(
          (c) =>
            c.toLowerCase() === 'uk' || c.toLowerCase() === 'united kingdom',
        ) || [],
    };
  } else if (country === 'US' || country === 'United States') {
    return {
      ...region,
      country:
        region?.country?.filter(
          (c) =>
            c.toLowerCase() === 'us' || c.toLowerCase() === 'united states',
        ) || [],
    };
  } else if (country === 'UAE' || country === 'United Arab Emirates') {
    return {
      ...region,
      country:
        region?.country?.filter(
          (c) =>
            c.toLowerCase() === 'uae' ||
            c.toLowerCase() === 'united arab emirates',
        ) || [],
    };
  } else {
    return {
      ...region,
      country:
        region?.country?.filter(
          (c) => c.toLowerCase() === country.toLowerCase(),
        ) || [],
    };
  }
};

export const getRegionTooltipLabel = (
  region: string | undefined,
  isGrant: boolean = false,
  chapters: ChapterRegionData[] = [],
) => {
  const normalizedRegion = region?.trim() || '';
  const regionObject = getCombinedRegion(normalizedRegion, false, chapters);

  const country =
    regionObject?.displayValue ||
    regionObject?.name ||
    normalizedRegion ||
    'your region';

  switch (normalizeRegionValue(region)) {
    case 'global':
      return 'This listing is open to everyone in the world!';
    case 'balkan':
      return `You need to be a resident of one of the Balkan countries to be able to participate in this ${isGrant ? 'grant' : 'listing'}`;
    default:
      return `You need to be a resident of ${country} to participate in this ${isGrant ? 'grant' : 'listing'} `;
  }
};

export function userRegionEligibilty({
  region,
  userLocation,
  chapters = [],
}: {
  region: string | undefined;
  userLocation: string | undefined;
  chapters?: ChapterRegionData[];
}) {
  if (normalizeRegionValue(region) === 'global') {
    return true;
  }

  const regionObject = region
    ? getCombinedRegion(region, false, chapters)
    : null;
  const normalizedUserLocation = normalizeRegionValue(userLocation);

  const isEligible =
    !!(
      userLocation &&
      (normalizeRegionValue(region) === normalizedUserLocation ||
        normalizeRegionValue(regionObject?.region) === normalizedUserLocation ||
        normalizeRegionValue(regionObject?.name) === normalizedUserLocation ||
        normalizeRegionValue(regionObject?.displayValue) ===
          normalizedUserLocation ||
        regionObject?.country?.some(
          (country) => normalizeRegionValue(country) === normalizedUserLocation,
        ))
    ) || false;

  return isEligible;
}

export function checkKycCountryMatchesRegion(
  kycCountry: string | null | undefined,
  listingRegion: string | null | undefined,
  chapters: ChapterRegionData[] = [],
): {
  isValid: boolean;
  regionDisplayName: string;
} {
  if (!listingRegion || normalizeRegionValue(listingRegion) === 'global') {
    return { isValid: true, regionDisplayName: 'Global' };
  }

  const regionObject = getCombinedRegion(listingRegion, false, chapters);
  const regionDisplayName =
    regionObject?.displayValue || regionObject?.name || listingRegion;

  if (!kycCountry) {
    return {
      isValid: false,
      regionDisplayName,
    };
  }

  const countryLookup = lookup.byIso(kycCountry);
  if (!countryLookup || !countryLookup.country) {
    return {
      isValid: false,
      regionDisplayName,
    };
  }

  const kycCountryName = countryLookup.country;

  if (!regionObject) {
    const isValid =
      normalizeRegionValue(listingRegion) ===
      normalizeRegionValue(kycCountryName);
    return {
      isValid,
      regionDisplayName: listingRegion,
    };
  }

  const isEligible =
    normalizeRegionValue(regionObject.name) ===
      normalizeRegionValue(kycCountryName) ||
    normalizeRegionValue(regionObject.region) ===
      normalizeRegionValue(kycCountryName) ||
    normalizeRegionValue(regionObject.displayValue) ===
      normalizeRegionValue(kycCountryName) ||
    regionObject.country?.some(
      (c) => normalizeRegionValue(c) === normalizeRegionValue(kycCountryName),
    ) ||
    false;

  return {
    isValid: isEligible,
    regionDisplayName,
  };
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function getRegionSlug(
  regionName: string,
  chapters: ChapterRegionData[] = [],
): string {
  const normalizedRegion = regionName.trim().toLowerCase();
  if (!normalizedRegion) {
    return '';
  }

  // Already a known canonical region slug.
  if (getAllRegionSlugs(chapters).includes(normalizedRegion)) {
    return normalizedRegion;
  }

  const chapter = chapters.find(
    (st) =>
      st.slug?.toLowerCase() === normalizedRegion ||
      st.region.toLowerCase() === normalizedRegion ||
      st.displayValue.toLowerCase() === normalizedRegion ||
      st.name.toLowerCase() === normalizedRegion ||
      st.country.some((country) => country.toLowerCase() === normalizedRegion),
  );
  if (chapter?.slug) {
    return chapter.slug.toLowerCase();
  }

  const country = countries.find(
    (c) => c.name.toLowerCase() === normalizedRegion,
  );
  if (country) {
    return generateSlug(country.name);
  }

  return generateSlug(regionName);
}

function getChapterCodes(chapters: ChapterRegionData[]): readonly string[] {
  return chapters
    .map((chapter) => chapter.code.toUpperCase())
    .filter((code) => code.length > 0);
}

function getEligibleCountries(chapters: ChapterRegionData[]) {
  const chapterCodes = getChapterCodes(chapters);

  return countries.filter((country) => {
    if (country.iso === true) {
      const countryCodeUpper = country.code.toUpperCase();
      return !chapterCodes.includes(countryCodeUpper);
    }

    if (country.region === true) {
      return true;
    }

    return false;
  });
}

export function findCountryBySlug(
  slug: string,
  chapters: ChapterRegionData[] = [],
) {
  const normalizedSlug = slug.toLowerCase();

  const chapter = chapters.find(
    (st) => st.slug?.toLowerCase() === normalizedSlug,
  );
  if (chapter) {
    return null;
  }

  const eligibleCountries = getEligibleCountries(chapters);
  return (
    eligibleCountries.find((country) => {
      const countrySlug = generateSlug(country.name);
      return countrySlug === normalizedSlug;
    }) || null
  );
}

export function getAllRegionSlugs(
  chapters: ChapterRegionData[] = [],
): readonly string[] {
  const chapterSlugs = chapters
    .map((chapter) => chapter.slug)
    .filter((slug): slug is string => typeof slug === 'string');

  const eligibleCountries = getEligibleCountries(chapters);
  const countrySlugs = eligibleCountries.map((country) =>
    generateSlug(country.name),
  );

  return [...chapterSlugs, ...countrySlugs];
}
