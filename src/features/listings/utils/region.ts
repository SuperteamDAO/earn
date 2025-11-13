import lookup from 'country-code-lookup';

import { countries } from '@/constants/country';
import { CombinedRegions } from '@/constants/Superteam';

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
    regionDisplayName:
      regionObject.displayValue || regionObject.name || listingRegion,
  };
}
