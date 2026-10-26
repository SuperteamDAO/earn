'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { posthog } from 'posthog-js';
import { useCallback, useOptimistic, useTransition } from 'react';

import { startTopLoader } from '@/components/ui/toploader';

import type {
  ListingCategory,
  ListingSortOption,
  ListingStatus,
  ListingTab,
  OrderDirection,
} from './useListings';

// What the server rendered the list with (from this page's search params).
export interface ListingState {
  readonly tab: ListingTab;
  readonly category: ListingCategory;
  readonly status: ListingStatus;
  readonly sortBy: ListingSortOption;
  readonly order: OrderDirection;
}

type QueryParamUpdates = Partial<
  Record<'tab' | 'category' | 'status' | 'sortBy' | 'order', string | null>
>;

// A list's filters live in the URL: a change navigates to the same page
// with new search params, and the server renders the list again. The
// chosen tab and pill light up at once; the old list stays until the new
// one arrives.
export const useListingState = ({
  state,
  defaults,
}: {
  readonly state: ListingState;
  // A parameter equal to its default is left out of the URL.
  readonly defaults: ListingState;
}) => {
  const router = useRouter();
  const pathname = usePathname() ?? '';
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(state);

  const updateQueryParams = useCallback(
    (updates: QueryParamUpdates, next: ListingState) => {
      const params = new URLSearchParams(searchParams?.toString() ?? '');
      const names = ['tab', 'category', 'status', 'sortBy', 'order'] as const;
      for (const name of names) {
        if (!(name in updates)) continue;
        const value = updates[name];
        if (value === null || value === undefined || value === defaults[name]) {
          params.delete(name);
        } else {
          params.set(name, value);
        }
      }
      const query = params.toString();
      startTopLoader();
      startTransition(() => {
        setOptimistic(next);
        router.replace(`${pathname}${query ? `?${query}` : ''}`, {
          scroll: false,
        });
      });
    },
    [searchParams, defaults, pathname, router, setOptimistic],
  );

  const handleTabChange = useCallback(
    (tab: ListingTab, posthogEvent: string) => {
      updateQueryParams({ tab }, { ...optimistic, tab });
      if (posthogEvent) posthog.capture(posthogEvent);
    },
    [updateQueryParams, optimistic],
  );

  const handleCategoryChange = useCallback(
    (category: ListingCategory, posthogEvent?: string) => {
      updateQueryParams({ category }, { ...optimistic, category });
      if (posthogEvent) posthog.capture(posthogEvent);
    },
    [updateQueryParams, optimistic],
  );

  const handleStatusChange = useCallback(
    (status: ListingStatus) => {
      updateQueryParams({ status }, { ...optimistic, status });
    },
    [updateQueryParams, optimistic],
  );

  const handleSortChange = useCallback(
    (sortBy: ListingSortOption, order: OrderDirection) => {
      updateQueryParams({ sortBy, order }, { ...optimistic, sortBy, order });
    },
    [updateQueryParams, optimistic],
  );

  return {
    activeTab: optimistic.tab,
    activeCategory: optimistic.category,
    activeStatus: optimistic.status,
    activeSortBy: optimistic.sortBy,
    activeOrder: optimistic.order,
    isPending,
    handleTabChange,
    handleCategoryChange,
    handleStatusChange,
    handleSortChange,
  };
};
