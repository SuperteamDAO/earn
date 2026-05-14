import lookup from 'country-code-lookup';

import type { ChapterRegionData } from '@/interface/chapter';

import { userRegionEligibilty } from './region';

export const REGION_VERIFICATION_STATUS = {
  NotRequired: 'NotRequired',
  KycCountryMatched: 'KycCountryMatched',
  PoaRequired: 'PoaRequired',
  PoaVerified: 'PoaVerified',
  Ineligible: 'Ineligible',
} as const;

export type RegionVerificationStatus =
  (typeof REGION_VERIFICATION_STATUS)[keyof typeof REGION_VERIFICATION_STATUS];

export function isGeoLockedRegion(region: string | null | undefined): boolean {
  return Boolean(region && region.trim().toLowerCase() !== 'global');
}

export function countryCodeToCountryName(country: string | null | undefined) {
  if (!country) return undefined;
  return lookup.byIso(country)?.country ?? country;
}

export function isCountryEligibleForRegion({
  country,
  region,
  chapters,
}: {
  country: string | null | undefined;
  region: string | null | undefined;
  chapters: ChapterRegionData[];
}) {
  if (!isGeoLockedRegion(region)) return true;

  const countryName = countryCodeToCountryName(country);
  if (!countryName) return false;

  const isGbrNiException =
    country?.toUpperCase() === 'GBR' &&
    region?.trim().toLowerCase() === 'ireland (ni and roi)';

  if (isGbrNiException) return true;

  return userRegionEligibilty({
    region: region ?? undefined,
    userLocation: countryName,
    chapters,
  });
}

export function getKycRegionVerificationStatus({
  region,
  kycCountry,
  chapters,
}: {
  region: string | null | undefined;
  kycCountry: string | null | undefined;
  chapters: ChapterRegionData[];
}): RegionVerificationStatus {
  if (!isGeoLockedRegion(region)) {
    return REGION_VERIFICATION_STATUS.NotRequired;
  }

  return isCountryEligibleForRegion({
    country: kycCountry,
    region,
    chapters,
  })
    ? REGION_VERIFICATION_STATUS.KycCountryMatched
    : REGION_VERIFICATION_STATUS.PoaRequired;
}

export function canPaySubmissionForRegion({
  region,
  kycCountry,
  regionVerificationStatus,
  regionVerificationCountry,
  chapters,
}: {
  region: string | null | undefined;
  kycCountry: string | null | undefined;
  regionVerificationStatus: RegionVerificationStatus | null | undefined;
  regionVerificationCountry?: string | null | undefined;
  chapters: ChapterRegionData[];
}) {
  if (!isGeoLockedRegion(region)) return true;

  if (regionVerificationStatus === REGION_VERIFICATION_STATUS.Ineligible) {
    return false;
  }

  if (regionVerificationStatus === REGION_VERIFICATION_STATUS.PoaVerified) {
    return isCountryEligibleForRegion({
      country: regionVerificationCountry,
      region,
      chapters,
    });
  }

  return isCountryEligibleForRegion({
    country: kycCountry,
    region,
    chapters,
  });
}
