import { type SponsorType } from '@/interface/sponsor';

type SponsorRegionInput = Pick<SponsorType, 'chapter'> | null | undefined;

export const getOfficialSuperteamRegion = (
  sponsor: SponsorRegionInput,
): string | null => {
  if (!sponsor?.chapter?.region) {
    return null;
  }

  return sponsor.chapter.region;
};
