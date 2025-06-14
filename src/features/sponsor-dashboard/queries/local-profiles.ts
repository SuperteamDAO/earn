import { queryOptions } from '@tanstack/react-query';

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

interface PaginatedResponse {
  users: LocalProfile[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface FetchLocalProfilesParams {
  page?: number;
  limit?: number;
  region: string;
}

const fetchLocalProfiles = async ({
  page = 1,
  limit = 10,
  region,
}: FetchLocalProfilesParams): Promise<PaginatedResponse> => {
  const { data } = await api.get('/api/sponsor-dashboard/local-talent/', {
    params: {
      page,
      limit,
      region,
    },
  });
  return data;
};

export const localProfilesQuery = (params: FetchLocalProfilesParams) =>
  queryOptions({
    queryKey: ['localProfiles', params],
    queryFn: () => fetchLocalProfiles(params),
  });
