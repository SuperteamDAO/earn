import { useQuery } from '@tanstack/react-query';
import { type z } from 'zod';

import { api } from '@/lib/api';

import {
  type ListingContextSchema,
  type ListingStatusSchema,
  type ListingTabSchema,
} from '@/features/listings/constants/schema';

export type ListingTab = z.infer<typeof ListingTabSchema>;
export type ListingStatus = z.infer<typeof ListingStatusSchema>;
export type ListingContext = z.infer<typeof ListingContextSchema>;

interface ListingsFilterCountParams {
  context: ListingContext;
  tab: ListingTab;
  status?: ListingStatus;
  region?: string;
  sponsor?: string;
  authenticated?: boolean;
}

export type CategoryCounts = Record<string, number>;

const fetchListingsFilterCount = async ({
  context,
  tab,
  status = 'open',
  region = '',
  sponsor = '',
}: ListingsFilterCountParams): Promise<CategoryCounts> => {
  const queryParams = new URLSearchParams({
    context,
    tab: tab,
    status,
    region,
    sponsor,
  });

  const { data } = await api.get(
    `/api/listings/count?${queryParams.toString()}`,
  );

  return data;
};

export function useListingsFilterCount({
  context,
  tab,
  status,
  region,
  sponsor,
  authenticated,
}: ListingsFilterCountParams) {
  return useQuery({
    queryKey: [
      'listings-filter-count',
      context,
      tab,
      status,
      region,
      sponsor,
      authenticated,
    ],
    queryFn: () =>
      fetchListingsFilterCount({
        context,
        tab,
        status,
        region,
        sponsor,
      }),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
