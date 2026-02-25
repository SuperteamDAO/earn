import { type SponsorType } from '@/interface/sponsor';

type SponsorRegionInput =
  | Pick<SponsorType, 'name' | 'slug' | 'chapter'>
  | null
  | undefined;

const normalize = (value?: string | null) => value?.trim().toLowerCase() || '';

export const getOfficialSuperteamRegion = (
  sponsor: SponsorRegionInput,
): string | null => {
  if (!sponsor) {
    return null;
  }

  if (sponsor.chapter?.region) {
    return sponsor.chapter.region;
  }

  const sponsorName = normalize(sponsor.name);
  const sponsorSlug = normalize(sponsor.slug);
  const normalized = sponsorName || sponsorSlug;
  if (!normalized) return null;

  const regionFromName = normalized.replace(/^superteam[\s-]*/i, '').trim();
  if (!regionFromName) return null;

  return regionFromName.charAt(0).toUpperCase() + regionFromName.slice(1);
};
