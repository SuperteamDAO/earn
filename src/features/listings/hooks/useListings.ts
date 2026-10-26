import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { z } from 'zod';

import { api } from '@/lib/api';

import type {
  ListingCategorySchema,
  ListingContextSchema,
  ListingSortOptionSchema,
  ListingStatusSchema,
  ListingTabSchema,
  OrderDirectionSchema,
} from '@/features/listings/constants/schema';

import type { Listing } from '../types';

export type ListingTab = z.infer<typeof ListingTabSchema>;
export type ListingCategory = z.infer<typeof ListingCategorySchema>;
export type ListingStatus = z.infer<typeof ListingStatusSchema>;
export type ListingSortOption = z.infer<typeof ListingSortOptionSchema>;
export type OrderDirection = z.infer<typeof OrderDirectionSchema>;
export type ListingContext = z.infer<typeof ListingContextSchema>;

interface ListingsParams {
  context: ListingContext;
  tab: ListingTab;
  category: string;
  status?: ListingStatus;
  sortBy?: ListingSortOption;
  order?: OrderDirection;
  region?: string;
  sponsor?: string;
  authenticated?: boolean;
  enabled?: boolean;
}

const fetchListings = async ({
  context,
  tab,
  category,
  status = 'open',
  sortBy = 'Date',
  order = 'asc',
  region = '',
  sponsor = '',
}: ListingsParams): Promise<Listing[]> => {
  const queryParams = new URLSearchParams({
    context,
    tab: tab,
    category,
    status,
    sortBy,
    order,
    region,
    sponsor,
  });

  const { data } = await api.get(`/api/listings?${queryParams.toString()}`);

  return data;
};

export function useListings({
  context,
  tab,
  category,
  status,
  sortBy,
  order,
  region,
  sponsor,
  authenticated,
  enabled = true,
}: ListingsParams) {
  return useQuery({
    enabled,
    // Keep showing the previous results while a new key loads (auth or
    // filter change) instead of collapsing back to skeletons.
    placeholderData: keepPreviousData,
    queryKey: [
      'listings',
      context,
      tab,
      category,
      status,
      sortBy,
      order,
      region,
      sponsor,
      authenticated,
    ],
    queryFn: () =>
      fetchListings({
        context,
        tab,
        category,
        status,
        sortBy,
        order,
        region,
        sponsor,
      }),
  });
}
