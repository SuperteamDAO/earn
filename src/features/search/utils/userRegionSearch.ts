import {
  filterRegionCountry,
  getCombinedRegion,
  getParentRegions,
} from '@/features/listings/utils/region';

export function getUserRegion(userLocation?: string | null): string[] | null {
  if (!userLocation) return null;

  const matchedRegion = getCombinedRegion(userLocation, true);

  if (matchedRegion?.name) {
    return [
      matchedRegion.name,
      'Global',
      ...(filterRegionCountry(matchedRegion, userLocation).country || []),
      ...(getParentRegions(matchedRegion) || []),
    ];
  } else {
    return ['Global'];
  }
}
