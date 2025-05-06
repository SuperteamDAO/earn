import { useRouter, useSearchParams } from 'next/navigation';
import { usePostHog } from 'posthog-js/react';
import { useCallback, useMemo } from 'react';

import {
  ListingCategorySchema,
  ListingSortOptionSchema,
  ListingStatusSchema,
  ListingTabSchema,
  OrderDirectionSchema,
} from '@/features/listings/constants/schema';

import type {
  ListingSortOption,
  ListingStatus,
  ListingTab,
  OrderDirection,
} from './useListings';

const DEFAULT_TAB_VALUE: ListingTab = ListingTabSchema._def.defaultValue();
const DEFAULT_STATUS_VALUE: ListingStatus =
  ListingStatusSchema._def.defaultValue();
const DEFAULT_ORDER_VALUE: OrderDirection =
  OrderDirectionSchema._def.defaultValue();
const DEFAULT_SORT_BY_VALUE: ListingSortOption =
  ListingSortOptionSchema._def.defaultValue();
const DEFAULT_HOOK_INITIAL_CATEGORY_VALUE =
  ListingCategorySchema._def.defaultValue();

interface UseListingStateProps {
  readonly defaultCategory?: string;
}

type QueryParamUpdates = Partial<
  Record<'tab' | 'category' | 'status' | 'sortBy' | 'order', string | null>
>;

export const useListingState = ({
  defaultCategory = DEFAULT_HOOK_INITIAL_CATEGORY_VALUE,
}: UseListingStateProps) => {
  const posthog = usePostHog();
  const router = useRouter();
  const searchParamsFromHook = useSearchParams();

  const searchParams = useMemo(
    () => searchParamsFromHook ?? new URLSearchParams(),
    [searchParamsFromHook],
  );

  const updateQueryParams = useCallback(
    (updates: QueryParamUpdates) => {
      const newParams = new URLSearchParams(Array.from(searchParams.entries()));

      const paramDefaults: Record<keyof QueryParamUpdates, unknown> = {
        tab: DEFAULT_TAB_VALUE,
        category: defaultCategory,
        status: DEFAULT_STATUS_VALUE,
        sortBy: DEFAULT_SORT_BY_VALUE,
        order: DEFAULT_ORDER_VALUE,
      };

      for (const key in updates) {
        const typedKey = key as keyof QueryParamUpdates;
        const value = updates[typedKey];
        const defaultValueForKey = paramDefaults[typedKey];

        if (
          value === null ||
          value === undefined ||
          value === defaultValueForKey
        ) {
          newParams.delete(typedKey);
        } else {
          newParams.set(typedKey, String(value));
        }
      }

      const queryString = newParams.toString();
      const newPath = `${window.location.pathname}${queryString ? `?${queryString}` : ''}`;
      router.replace(newPath, { scroll: false });
    },
    [searchParams, router, defaultCategory],
  );

  const activeTab = useMemo((): ListingTab => {
    const tabParam = searchParams.get('tab');
    if (tabParam === null) return DEFAULT_TAB_VALUE;
    const parsed = ListingTabSchema.safeParse(tabParam);
    if (parsed.success && parsed.data !== undefined) {
      return parsed.data;
    }
    return DEFAULT_TAB_VALUE;
  }, [searchParams]);

  const activeCategory = useMemo(
    (): string => searchParams.get('category') ?? defaultCategory,
    [searchParams, defaultCategory],
  );

  const activeStatus = useMemo((): ListingStatus => {
    const statusParam = searchParams.get('status');
    if (statusParam === null) return DEFAULT_STATUS_VALUE;
    const parsed = ListingStatusSchema.safeParse(statusParam);
    if (parsed.success && parsed.data !== undefined) {
      return parsed.data;
    }
    return DEFAULT_STATUS_VALUE;
  }, [searchParams]);

  const activeSortBy = useMemo((): ListingSortOption => {
    const sortByParam = searchParams.get('sortBy');
    if (sortByParam === null) return DEFAULT_SORT_BY_VALUE;
    const parsed = ListingSortOptionSchema.safeParse(sortByParam);
    if (parsed.success && parsed.data !== undefined) {
      return parsed.data;
    }
    return DEFAULT_SORT_BY_VALUE;
  }, [searchParams]);

  const activeOrder = useMemo((): OrderDirection => {
    const orderParam = searchParams.get('order');
    if (orderParam === null) return DEFAULT_ORDER_VALUE;
    const parsed = OrderDirectionSchema.safeParse(orderParam);
    if (parsed.success && parsed.data !== undefined) {
      return parsed.data;
    }
    return DEFAULT_ORDER_VALUE;
  }, [searchParams]);

  const handleTabChange = useCallback(
    (tabId: ListingTab, posthogEvent: string) => {
      updateQueryParams({ tab: tabId });
      posthog.capture(posthogEvent);
    },
    [updateQueryParams, posthog],
  );

  const handleCategoryChange = useCallback(
    (category: string, posthogEvent?: string) => {
      updateQueryParams({ category });
      if (posthogEvent) {
        posthog.capture(posthogEvent);
      }
    },
    [updateQueryParams, posthog],
  );

  const handleStatusChange = useCallback(
    (status: ListingStatus) => {
      updateQueryParams({ status });
    },
    [updateQueryParams],
  );

  const handleSortChange = useCallback(
    (sortBy: ListingSortOption, order: OrderDirection) => {
      updateQueryParams({ sortBy, order });
    },
    [updateQueryParams],
  );

  return {
    activeTab,
    activeCategory,
    activeStatus,
    activeSortBy,
    activeOrder,
    handleTabChange,
    handleCategoryChange,
    handleStatusChange,
    handleSortChange,
  };
};
