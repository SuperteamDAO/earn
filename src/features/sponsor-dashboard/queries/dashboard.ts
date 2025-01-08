import { queryOptions } from '@tanstack/react-query';

import { api } from '@/lib/api';

import { type ListingWithSubmissions } from '@/features/listings/types';

const fetchListings = async (): Promise<ListingWithSubmissions[]> => {
  const { data } = await api.get('/api/sponsor-dashboard/listings');
  return data;
};

export const dashboardQuery = (sponsorId: string | undefined) =>
  queryOptions({
    queryKey: ['dashboard', sponsorId],
    queryFn: () => fetchListings(),
    retry: false,
  });
