import { countries } from '@/constants/country';
import { CombinedRegions, Superteams } from '@/constants/Superteam';

export const getCombinedRegion = (
  region: string,
  lookupSTCountries: boolean = false,
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
    regionObject = CombinedRegions.find((superteam) =>
      superteam.country
        .map((c) => c.toLowerCase())
        .includes(region?.toLowerCase()),
    );
  }
  if (!regionObject) {
    regionObject = CombinedRegions.find((superteam) =>
      superteam.region.toLowerCase().includes(region?.toLowerCase()),
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
  const country = getCombinedRegion(region || '')?.name;

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
  if (region === 'Global') {
    return true;
  }

  const regionObject = region ? getCombinedRegion(region) : null;

  const isEligible =
    !!(
      userLocation &&
      (regionObject?.name === userLocation ||
        regionObject?.country?.includes(userLocation) ||
        regionObject?.regions?.includes(userLocation))
    ) || false;

  return isEligible;
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getSuperteamCodes(): readonly string[] {
  return Superteams.map((st) => st.code.toUpperCase());
}

export function getEligibleCountries() {
  const superteamCodes = getSuperteamCodes();

  return countries.filter((country) => {
    if (country.iso === true) {
      const countryCodeUpper = country.code.toUpperCase();
      return !superteamCodes.includes(countryCodeUpper);
    }

    if (country.region === true) {
      return true;
    }

    return false;
  });
}

export function findCountryBySlug(slug: string) {
  const normalizedSlug = slug.toLowerCase();

  const superteam = Superteams.find(
    (st) => st.slug?.toLowerCase() === normalizedSlug,
  );
  if (superteam) {
    return null;
  }

  const eligibleCountries = getEligibleCountries();
  return (
    eligibleCountries.find((country) => {
      const countrySlug = generateSlug(country.name);
      return countrySlug === normalizedSlug;
    }) || null
  );
}

export function getAllRegionSlugs(): readonly string[] {
  const superteamSlugs = Superteams.map((st) => st.slug).filter(
    (slug): slug is string => typeof slug === 'string',
  );

  const eligibleCountries = getEligibleCountries();
  const countrySlugs = eligibleCountries.map((country) =>
    generateSlug(country.name),
  );

  return [...superteamSlugs, ...countrySlugs];
}

function getMultiCountryRegionsContainingCountry(
  countryName: string,
): string[] {
  const regions: string[] = [];

  const regionsFromCountries = countries
    .filter(
      (c) =>
        c.region &&
        c.regions &&
        Array.isArray(c.regions) &&
        c.regions.includes(countryName),
    )
    .map((c) => c.name);
  regions.push(...regionsFromCountries);

  const regionsFromSuperteams = Superteams.filter(
    (st) =>
      st.country &&
      Array.isArray(st.country) &&
      st.country.includes(countryName),
  ).map((st) => st.region);
  regions.push(...regionsFromSuperteams);

  return regions;
}

function getSuperteamRegionsContainingCountries(
  countryNames: string[],
): string[] {
  return Superteams.filter((st) =>
    st.country.some((countryName) => countryNames.includes(countryName)),
  ).map((st) => st.region);
}

export function getRegionsForSuperteamPage(superteamRegion: string): string[] {
  const st = Superteams.find(
    (team) => team.region.toLowerCase() === superteamRegion.toLowerCase(),
  );
  if (!st) return ['Global'];

  const regions: string[] = [
    superteamRegion.charAt(0).toUpperCase() + superteamRegion.slice(1),
    ...(st.country || []),
    'Global',
  ];

  if (st.country && Array.isArray(st.country)) {
    const multiCountryRegions = countries
      .filter(
        (c) =>
          c.region &&
          c.regions &&
          Array.isArray(c.regions) &&
          st.country.some((countryName) => c.regions.includes(countryName)),
      )
      .map((c) => c.name);
    regions.push(...multiCountryRegions);
  }

  return Array.from(new Set(regions));
}

export function getRegionsForMultiCountryRegionPage(
  regionName: string,
): string[] {
  const country = countries.find(
    (c) => c.name.toLowerCase() === regionName.toLowerCase(),
  );

  if (!country?.region || !country.regions || !Array.isArray(country.regions)) {
    return ['Global'];
  }

  const regions: string[] = [country.name, ...country.regions, 'Global'];

  const superteamRegions = getSuperteamRegionsContainingCountries(
    country.regions,
  );
  regions.push(...superteamRegions);

  return Array.from(new Set(regions));
}

export function getRegionsForCountryPage(countryName: string): string[] {
  const regions: string[] = [countryName, 'Global'];

  const multiCountryRegions =
    getMultiCountryRegionsContainingCountry(countryName);
  regions.push(...multiCountryRegions);

  return Array.from(new Set(regions));
}

export function getRegionsForUserLocation(
  userLocation: string | null,
): string[] {
  if (!userLocation) return ['Global'];

  const userRegion = getCombinedRegion(userLocation, true);
  if (!userRegion?.name) return ['Global'];

  const regions: string[] = ['Global'];

  regions.push(userLocation);

  if (userRegion.country && Array.isArray(userRegion.country)) {
    regions.push(userRegion.name);
  } else {
    regions.push(userRegion.name);
  }

  const parentRegions = getParentRegions(userRegion) || [];
  regions.push(...parentRegions);

  const multiCountryRegionsFromCountries = countries
    .filter(
      (c) =>
        c.region &&
        c.regions &&
        Array.isArray(c.regions) &&
        c.regions.some(
          (countryName) =>
            countryName.toLowerCase() === userLocation.toLowerCase(),
        ),
    )
    .map((c) => c.name);
  regions.push(...multiCountryRegionsFromCountries);

  const multiCountryRegionsFromSuperteams = Superteams.filter((st) =>
    st.country.some(
      (countryName) => countryName.toLowerCase() === userLocation.toLowerCase(),
    ),
  ).map((st) => st.region);
  regions.push(...multiCountryRegionsFromSuperteams);

  if (userRegion.country && Array.isArray(userRegion.country)) {
    const regionsContainingSuperteamCountries = countries
      .filter(
        (c) =>
          c.region &&
          c.regions &&
          Array.isArray(c.regions) &&
          userRegion.country?.some((countryName) =>
            c.regions.includes(countryName),
          ),
      )
      .map((c) => c.name);
    regions.push(...regionsContainingSuperteamCountries);
  }

  return Array.from(new Set(regions));
}
