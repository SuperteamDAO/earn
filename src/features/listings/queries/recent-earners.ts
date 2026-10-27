import { queryOptions } from '@tanstack/react-query';

import { api } from '@/lib/api';

// Shape returned by /api/homepage/recent-earners (one entry per winning submission).
export interface RecentEarner {
  id: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  slug: string;
  title: string;
  reward?: number;
  rewardToken: string | null;
  photo: string | null;
  winnersAnnouncedAt: string | null;
}

const fetchRecentEarners = async (): Promise<RecentEarner[]> => {
  const response = await api.get('/api/homepage/recent-earners');
  return response.data;
};

export const recentEarnersQuery = queryOptions({
  queryKey: ['recentEarners'],
  queryFn: fetchRecentEarners,
  staleTime: 1000 * 60 * 60,
  gcTime: 1000 * 60 * 60 * 2,
});
