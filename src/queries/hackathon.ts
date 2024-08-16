import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

import { type TrackProps } from '@/interface/hackathon';

interface Stats {
  totalRewardAmount: number;
  totalListings: number;
}

const fetchTracks = async (slug: string) => {
  const response = await axios.get('/api/hackathon/', {
    params: { slug },
  });
  return response.data;
};

const fetchStats = async (slug: string) => {
  const response = await axios.get('/api/hackathon/public-stats/', {
    params: { slug },
  });
  return response.data;
};

export const useTrackData = (slug: string) => {
  return useQuery<TrackProps[]>({
    queryKey: ['tracks', slug],
    queryFn: () => fetchTracks(slug),
  });
};

export const useStatsData = (slug: string) => {
  return useQuery<Stats>({
    queryKey: ['stats', slug],
    queryFn: () => fetchStats(slug),
  });
};
