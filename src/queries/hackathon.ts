import { queryOptions } from '@tanstack/react-query';

import { type TrackProps } from '@/interface/hackathon';
import { api } from '@/lib/api';

export interface Stats {
  totalRewardAmount: number;
  totalListings: number;
  deadline: string;
  startDate: string;
  announceDate: string;
}

const fetchTracks = async (slug: string): Promise<TrackProps[]> => {
  const response = await api.get(`/api/hackathon/${slug}`);
  return response.data;
};

const fetchStats = async (slug: string): Promise<Stats> => {
  const response = await api.get('/api/hackathon/public-stats/', {
    params: { slug },
  });
  return response.data;
};

export const trackDataQuery = (slug: string) =>
  queryOptions({
    queryKey: ['tracks', slug],
    queryFn: () => fetchTracks(slug),
  });

export const statsDataQuery = (slug: string) =>
  queryOptions({
    queryKey: ['stats', slug],
    queryFn: () => fetchStats(slug),
  });
