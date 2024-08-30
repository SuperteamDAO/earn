import { queryOptions } from '@tanstack/react-query';
import axios from 'axios';

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

const fetchLocalProfiles = async (): Promise<LocalProfile[]> => {
  const { data } = await axios.get('/api/sponsor-dashboard/local-profiles/', {
    params: {},
  });
  return data;
};

export const localProfilesQuery = queryOptions({
  queryKey: ['localProfiles'],
  queryFn: () => fetchLocalProfiles(),
});
