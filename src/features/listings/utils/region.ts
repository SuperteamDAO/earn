import lookup from 'country-code-lookup';

import { countries } from '@/constants/country';
import type { ChapterRegionData } from '@/interface/chapter';

export const getCombinedRegion = (
  region: string,
  lookupSTCountries: boolean = false,
  chapters: ChapterRegionData[] = [],
) => {
  let regionObject:
    | {
        name?: string;
        code: string;
        country?: string[];
        displayValue?: string;
        regions?: string[];
      }
    | undefined;
  if (lookupSTCountries) {
    regionObject = chapters.find((chapter) =>
      chapter.country
        .map((c) => c.toLowerCase())
        .includes(region?.toLowerCase()),
    );
  }
  if (!regionObject) {
    const normalizedRegion = region?.toLowerCase();
    regionObject = chapters.find((chapter) => {
      return (
        chapter.region.toLowerCase().includes(normalizedRegion) ||
        chapter.displayValue.toLowerCase().includes(normalizedRegion) ||
        chapter.name.toLowerCase().includes(normalizedRegion)
      );
    });
  }
  if (!regionObject) {
    regionObject = chapters.find((chapter) =>
      chapter.country
        .map((country) => country.toLowerCase())
        .includes(region?.toLowerCase()),
    );
  }
  if (regionObject?.displayValue) {
    regionObject = {
      ...regionObject,
      name: regionObject.displayValue,
    };
  }
  if (!regionObject) {
    regionObject = countries.find(
      (country) => country.name.toLowerCase() === region?.toLowerCase(),
    );
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
) => {
  const normalizedRegion = region?.trim() || '';
  let isoCountry: string | undefined;

  if (/^[a-zA-Z]{2,3}$/.test(normalizedRegion)) {
    try {
      isoCountry = lookup.byIso(normalizedRegion)?.country;
    } catch {
      isoCountry = undefined;
    }
  }

  const country =
    getCombinedRegion(normalizedRegion)?.name ||
    isoCountry ||
    normalizedRegion ||
    'your region';

  switch (region) {
    case 'Global':
      return 'This listing is open to everyone in the world!';
    case 'BALKAN':
      return `You need to be a resident of one of the Balkan countries to be able to participate in this ${isGrant ? 'grant' : 'listing'}`;
    default:
      return `You need to be a resident of ${country} to participate in this ${isGrant ? 'grant' : 'listing'} `;
  }
};

export function userRegionEligibilty({
  region,
  userLocation,
}: {
  region: string | undefined;
  userLocation: string | undefined;
}) {
  const normalizeRegionValue = (value: string | undefined) => {
    const normalized = value?.trim().toLowerCase() || '';
    if (normalized === 'ireland' || normalized === 'ireland (open ni and roi)')
      return 'ireland (ni and roi)';
    return normalized;
  };

  if (region === 'Global') {
    return true;
  }

  const regionObject = region ? getCombinedRegion(region) : null;
  const normalizedUserLocation = normalizeRegionValue(userLocation);

  const isEligible =
    !!(
      userLocation &&
      (normalizeRegionValue(region) === normalizedUserLocation ||
        normalizeRegionValue(regionObject?.name) === normalizedUserLocation ||
        regionObject?.country?.some(
          (country) => normalizeRegionValue(country) === normalizedUserLocation,
        ) ||
        regionObject?.regions?.some(
          (regionName) =>
            normalizeRegionValue(regionName) === normalizedUserLocation,
        ))
    ) || false;

  return isEligible;
}

export function checkKycCountryMatchesRegion(
  kycCountry: string | null | undefined,
  listingRegion: string | null | undefined,
): {
  isValid: boolean;
  regionDisplayName: string;
} {
  if (!listingRegion || listingRegion === 'Global') {
    return { isValid: true, regionDisplayName: 'Global' };
  }

  if (!kycCountry) {
    const regionObject = getCombinedRegion(listingRegion);
    return {
      isValid: false,
      regionDisplayName:
        regionObject?.displayValue || regionObject?.name || listingRegion,
    };
  }

  const countryLookup = lookup.byIso(kycCountry);
  if (!countryLookup || !countryLookup.country) {
    const regionObject = getCombinedRegion(listingRegion);
    return {
      isValid: false,
      regionDisplayName:
        regionObject?.displayValue || regionObject?.name || listingRegion,
    };
  }

  const kycCountryName = countryLookup.country;
  const regionObject = getCombinedRegion(listingRegion);
  const regionDisplayName =
    regionObject?.displayValue || regionObject?.name || listingRegion;

  // Sumsub returns GBR for Northern Ireland driving licenses.
  // Ireland-restricted listings should allow this path.
  const normalizedRegion = regionDisplayName.trim().toLowerCase();
  if (
    kycCountry.toUpperCase() === 'GBR' &&
    (normalizedRegion === 'ireland' ||
      normalizedRegion === 'ire' ||
      normalizedRegion === 'ireland (ni and roi)')
  ) {
    return {
      isValid: true,
      regionDisplayName,
    };
  }

  if (!regionObject) {
    const isValid =
      listingRegion.toLowerCase() === kycCountryName.toLowerCase();
    return {
      isValid,
      regionDisplayName: listingRegion,
    };
  }

  const isEligible =
    regionObject.name?.toLowerCase() === kycCountryName.toLowerCase() ||
    regionObject.country?.some(
      (c) => c.toLowerCase() === kycCountryName.toLowerCase(),
    ) ||
    regionObject.regions?.some(
      (r) => r.toLowerCase() === kycCountryName.toLowerCase(),
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
