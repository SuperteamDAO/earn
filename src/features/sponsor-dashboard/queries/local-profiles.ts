import { queryOptions } from '@tanstack/react-query';

import { Superteams, unofficialSuperteams } from '@/constants/Superteam';
import { api } from '@/lib/api';

export interface LocalProfile {
  id: string;
  photo: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  bio: string;
  totalEarnings: number;
  totalSubmissions: number;
  rank: number;
  wins: number;
  skills: any;
  twitter: string;
  telegram: string;
  discord: string;
  website: string;
  community: string;
  interests: string;
  createdAt: string;
}

const fetchLocalProfiles = async ({
  sponsorName,
}: {
  sponsorName: string;
}): Promise<LocalProfile[]> => {
  const matchedSuperteam =
    Superteams.find(
      (team) => team.name.toLowerCase() === sponsorName.toLowerCase(),
    ) ||
    unofficialSuperteams.find(
      (team) => team.name.toLowerCase() === sponsorName.toLowerCase(),
    );

  const matchedSuperteamRegion = matchedSuperteam?.region;
  const matchedSuperteamCountries = matchedSuperteam?.country;

  const { data } = await api.get(
    `/api/sponsor-dashboard/local-talent/?superteamRegion=${matchedSuperteamRegion}&superteamCountries=${matchedSuperteamCountries}`,
  );
  return data;
};

export const localProfilesQuery = (sponsorName: string) =>
  queryOptions({
    queryKey: ['localProfiles', sponsorName],
    queryFn: () => fetchLocalProfiles({ sponsorName }),
    enabled: !!sponsorName,
    retry: false,
  });
