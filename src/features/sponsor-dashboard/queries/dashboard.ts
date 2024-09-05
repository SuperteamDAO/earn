import { queryOptions } from '@tanstack/react-query';
import axios from 'axios';

import { type ListingWithSubmissions } from '@/features/listings';

const fetchListings = async (): Promise<ListingWithSubmissions[]> => {
  const { data } = await axios.get('/api/sponsor-dashboard/listings');
  return data;
};

export const dashboardQuery = (sponsorId: string | undefined) =>
  queryOptions({
    queryKey: ['dashboard', sponsorId],
    queryFn: () => fetchListings(),
    retry: false,
  });
