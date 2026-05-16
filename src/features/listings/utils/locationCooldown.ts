import dayjs from 'dayjs';

import type { ChapterRegionData } from '@/interface/chapter';

import { userRegionEligibilty } from './region';

export const LOCATION_COOLDOWN_DAYS = 21;

interface LocationCooldownInput {
  locationUpdatedAt: Date | string | null | undefined;
  listingRegion: string | null | undefined;
  userLocation: string | null | undefined;
  chapters: ChapterRegionData[];
}

interface LocationCooldownResult {
  inCooldown: boolean;
  daysRemaining: number;
}

export function getLocationCooldown({
  locationUpdatedAt,
  listingRegion,
  userLocation,
  chapters,
}: LocationCooldownInput): LocationCooldownResult {
  if (!locationUpdatedAt) return { inCooldown: false, daysRemaining: 0 };

  const region = (listingRegion || '').trim();
  if (!region || region.toLowerCase() === 'global') {
    return { inCooldown: false, daysRemaining: 0 };
  }

  const matchesNewLocation = userRegionEligibilty({
    region,
    userLocation: userLocation || '',
    chapters,
  });
  if (!matchesNewLocation) return { inCooldown: false, daysRemaining: 0 };

  const cooldownEndsAt = dayjs(locationUpdatedAt).add(
    LOCATION_COOLDOWN_DAYS,
    'day',
  );
  const daysRemaining = Math.max(0, cooldownEndsAt.diff(dayjs(), 'day', true));
  if (daysRemaining <= 0) return { inCooldown: false, daysRemaining: 0 };

  return { inCooldown: true, daysRemaining: Math.ceil(daysRemaining) };
}

export function locationCooldownTooltip(daysRemaining: number): string {
  return `Ineligible to submit for this listing. Since you changed your Earn profile location recently, you will have to wait for the cooldown period to get over to be able to submit to this regional listing. Your cooldown period ends in ${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'}.`;
}
