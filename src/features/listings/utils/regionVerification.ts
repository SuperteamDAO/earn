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

export const KYC_REGION_VERIFICATION_CUTOFF = new Date('2025-08-06');

export type RegionVerificationStatus =
  (typeof REGION_VERIFICATION_STATUS)[keyof typeof REGION_VERIFICATION_STATUS];

function isGeoLockedRegion(region: string | null | undefined): boolean {
  return Boolean(region && region.trim().toLowerCase() !== 'global');
}

function countryCodeToCountryName(country: string | null | undefined) {
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

export function getEffectiveRegionVerificationStatus({
  region,
  kycCountry,
  regionVerificationStatus,
  chapters,
}: {
  region: string | null | undefined;
  kycCountry: string | null | undefined;
  regionVerificationStatus: RegionVerificationStatus | null | undefined;
  chapters: ChapterRegionData[];
}): RegionVerificationStatus {
  if (!isGeoLockedRegion(region)) {
    return REGION_VERIFICATION_STATUS.NotRequired;
  }

  if (
    regionVerificationStatus === REGION_VERIFICATION_STATUS.KycCountryMatched ||
    regionVerificationStatus === REGION_VERIFICATION_STATUS.PoaRequired ||
    regionVerificationStatus === REGION_VERIFICATION_STATUS.PoaVerified ||
    regionVerificationStatus === REGION_VERIFICATION_STATUS.Ineligible
  ) {
    return regionVerificationStatus;
  }

  return getKycRegionVerificationStatus({
    region,
    kycCountry,
    chapters,
  });
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

  const effectiveStatus = getEffectiveRegionVerificationStatus({
    region,
    kycCountry,
    regionVerificationStatus,
    chapters,
  });

  if (effectiveStatus === REGION_VERIFICATION_STATUS.Ineligible) {
    return false;
  }

  if (effectiveStatus === REGION_VERIFICATION_STATUS.PoaVerified) {
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
