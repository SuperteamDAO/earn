import { countries } from '@/constants/country';
import { CombinedRegions } from '@/constants/Team';

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
      }
    | undefined;
  if (lookupSTCountries) {
    regionObject = CombinedRegions.find((team) =>
      team.country.map((c) => c.toLowerCase()).includes(region?.toLowerCase()),
    );
  }
  if (!regionObject) {
    regionObject = CombinedRegions.find((team) =>
      team.region.toLowerCase().includes(region?.toLowerCase()),
    );
  }
  if (regionObject?.displayValue) {
    regionObject.name = regionObject.displayValue;
  }
  if (!regionObject) {
    regionObject = countries.find(
      (country) => country.name.toLowerCase() === region?.toLowerCase(),
    );
  }

  return regionObject;
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
    case 'GLOBAL':
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
  if (region === 'GLOBAL') {
    return true;
  }

  const regionObject = region ? getCombinedRegion(region) : null;

  const isEligible =
    !!(
      userLocation &&
      (regionObject?.name === userLocation ||
        regionObject?.country?.includes(userLocation))
    ) || false;

  return isEligible;
}
