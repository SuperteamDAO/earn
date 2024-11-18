import { countries } from '@/constants';
import { CombinedRegions } from '@/constants/Superteam';

export const getCombinedRegion = (region: string) => {
  let regionObject:
    | {
        name?: string;
        code: string;
        country?: string[];
        displayValue?: string;
      }
    | undefined;
  regionObject = CombinedRegions.find((superteam) =>
    superteam.country
      .map((c) => c.toLowerCase())
      .includes(region?.toLowerCase()),
  );
  if (regionObject?.displayValue) {
    regionObject.name = regionObject.displayValue;
  }
  console.log('superteam country', regionObject);
  if (!regionObject) {
    regionObject = countries.find(
      (country) => country.name.toLowerCase() === region?.toLowerCase(),
    );
  }

  return regionObject;
};

export const getRegionTooltipLabel = (
  region: string | undefined,
  isGrant: boolean = false,
) => {
  const country = countries.find(
    (country) => country.name.toLowerCase() === region?.toLowerCase(),
  )?.name;

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
