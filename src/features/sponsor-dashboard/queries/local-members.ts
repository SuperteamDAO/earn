import { queryOptions } from '@tanstack/react-query';
import axios from 'axios';

export interface LocalMember {
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

const fetchLocalMembers = async (): Promise<LocalMember[]> => {
  const { data } = await axios.get('/api/sponsor-dashboard/local-members/', {
    params: {},
  });
  return data;
};

export const localMembersQuery = queryOptions({
  queryKey: ['localMembers'],
  queryFn: () => fetchLocalMembers(),
});
