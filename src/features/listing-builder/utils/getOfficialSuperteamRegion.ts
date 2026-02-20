import { Superteams } from '@/constants/Superteam';
import { type SponsorType } from '@/interface/sponsor';

type SponsorRegionInput = Pick<SponsorType, 'name' | 'slug'> | null | undefined;

const normalize = (value?: string | null) => value?.trim().toLowerCase() || '';

const removeSuperteamPrefix = (value: string) =>
  value.replace(/^superteam[\s-]*/i, '').trim();

export const getOfficialSuperteamRegion = (
  sponsor: SponsorRegionInput,
): string | null => {
  if (!sponsor) {
    return null;
  }

  const sponsorName = normalize(sponsor.name);
  const sponsorSlug = normalize(sponsor.slug);
  const sponsorNameNoPrefix = removeSuperteamPrefix(sponsorName);
  const sponsorSlugNoPrefix = removeSuperteamPrefix(sponsorSlug);

  const matchedSuperteam = Superteams.find((team) => {
    const teamName = normalize(team.name);
    const teamSlug = normalize(team.slug);
    const teamRegion = normalize(team.region);
    const teamDisplayValue = normalize(team.displayValue);

    return (
      sponsorName === teamName ||
      sponsorSlug === teamSlug ||
      sponsorSlugNoPrefix === teamSlug ||
      sponsorNameNoPrefix === teamSlug ||
      sponsorNameNoPrefix === teamRegion ||
      sponsorNameNoPrefix === teamDisplayValue
    );
  });

  return matchedSuperteam?.region || null;
};
