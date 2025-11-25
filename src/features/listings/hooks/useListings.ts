import { useQuery } from '@tanstack/react-query';
import { type z } from 'zod';

import { api } from '@/lib/api';

import {
  type ListingCategorySchema,
  type ListingContextSchema,
  type ListingSortOptionSchema,
  type ListingStatusSchema,
  type ListingTabSchema,
  type OrderDirectionSchema,
} from '@/features/listings/constants/schema';

import { type Listing } from '../types';

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
  skill?: string;
  authenticated?: boolean;
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
  skill = '',
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

  if (skill) {
    queryParams.set('skill', skill);
  }

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
  skill,
  authenticated,
}: ListingsParams) {
  return useQuery({
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
      skill,
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
        skill,
      }),
  });
}
