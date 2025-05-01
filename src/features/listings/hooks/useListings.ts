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
} from '@/pages/api/v2';

import { type Listing } from '../types';

export type ListingTab = z.infer<typeof ListingTabSchema>;
export type ListingPill = z.infer<typeof ListingCategorySchema>;
export type ListingStatus = z.infer<typeof ListingStatusSchema>;
export type ListingSortOption = z.infer<typeof ListingSortOptionSchema>;
export type OrderDirection = z.infer<typeof OrderDirectionSchema>;
export type ListingContext = z.infer<typeof ListingContextSchema>;

export interface ListingsParams {
  context: ListingContext;
  tab: string;
  pill: string;
  status?: ListingStatus;
  sortBy?: ListingSortOption;
  order?: OrderDirection;
}

const tabMap: Record<string, ListingTab> = {
  all_open: 'All Open',
  bounties: 'Bounties',
  projects: 'Projects',
};

const fetchListings = async ({
  context,
  tab,
  pill,
  status = 'open',
  sortBy = 'Due Date',
  order = 'asc',
}: ListingsParams): Promise<Listing[]> => {
  const queryParams = new URLSearchParams({
    context,
    tab: tabMap[tab] || 'All Open',
    pill,
    status,
    sortBy,
    order,
  });

  const { data } = await api.get(`/api/v2?${queryParams.toString()}`);

  return data;
};

export function useListings({
  context,
  tab,
  pill,
  status,
  sortBy,
  order,
}: ListingsParams) {
  return useQuery({
    queryKey: ['listings', context, tab, pill, status, sortBy, order],
    queryFn: () => fetchListings({ context, tab, pill, status, sortBy, order }),
  });
}
