import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import posthog from 'posthog-js';
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  ListingCategorySchema,
  ListingSortOptionSchema,
  ListingStatusSchema,
  ListingTabSchema,
  OrderDirectionSchema,
} from '@/features/listings/constants/schema';

import type {
  ListingCategory,
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
const DEFAULT_HOOK_INITIAL_CATEGORY_VALUE: ListingCategory =
  ListingCategorySchema._def.defaultValue();

interface UseListingStateProps {
  readonly defaultCategory?: ListingCategory;
  readonly defaultStatus?: ListingStatus;
  readonly defaultSortBy?: ListingSortOption;
}

type QueryParamUpdates = Partial<
  Record<'tab' | 'category' | 'status' | 'sortBy' | 'order', string | null>
>;

export const useListingState = ({
  defaultCategory = DEFAULT_HOOK_INITIAL_CATEGORY_VALUE,
  defaultStatus = DEFAULT_STATUS_VALUE,
  defaultSortBy = DEFAULT_SORT_BY_VALUE,
}: UseListingStateProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParamsFromHook = useSearchParams();

  const searchParams = useMemo(
    () => searchParamsFromHook ?? new URLSearchParams(),
    [searchParamsFromHook],
  );

  const getTabFromParams = useCallback(
    (params: URLSearchParams): ListingTab => {
      const tabParam = params.get('tab');
      if (tabParam === null) return DEFAULT_TAB_VALUE;
      const parsed = ListingTabSchema.safeParse(tabParam);
      if (parsed.success && parsed.data !== undefined) {
        return parsed.data;
      }
      return DEFAULT_TAB_VALUE;
    },
    [],
  );

  const getCategoryFromParams = useCallback(
    (params: URLSearchParams, defaultCat: ListingCategory): ListingCategory => {
      const categoryParam = params.get('category');
      if (categoryParam === null) return defaultCat;
      const parsed = ListingCategorySchema.safeParse(categoryParam);
      if (parsed.success && parsed.data !== undefined) {
        return parsed.data;
      }
      return defaultCat;
    },
    [],
  );

  const [internalActiveTab, setInternalActiveTab] = useState<ListingTab>(() =>
    getTabFromParams(searchParams),
  );

  const [internalActiveCategory, setInternalActiveCategory] =
    useState<ListingCategory>(() =>
      getCategoryFromParams(searchParams, defaultCategory),
    );

  useEffect(() => {
    const tabFromUrl = getTabFromParams(searchParams);
    // This effect syncs the URL tab to the internal state, primarily for external navigation (back/forward) or initial load.
    // internalActiveTab is intentionally omitted from deps to prevent this effect from reverting an optimistic update
    // made by handleTabChange before searchParams has a chance to reflect that update.
    // The functional update form of setInternalActiveTab ensures we compare against the most current state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    setInternalActiveTab((currentInternalTab) => {
      if (tabFromUrl !== currentInternalTab) {
        return tabFromUrl;
      }
      return currentInternalTab;
    });
  }, [searchParams, getTabFromParams]);

  useEffect(() => {
    const categoryFromUrl = getCategoryFromParams(
      searchParams,
      defaultCategory,
    );
    // Sync URL category to internal state for external navigation or initial load.
    // internalActiveCategory is intentionally omitted from deps to prevent this effect
    // from reverting an optimistic update made by handleCategoryChange.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    setInternalActiveCategory((currentInternalCategory) => {
      if (categoryFromUrl !== currentInternalCategory) {
        return categoryFromUrl;
      }
      return currentInternalCategory;
    });
  }, [searchParams, getCategoryFromParams, defaultCategory]);

  const updateQueryParams = useCallback(
    (updates: QueryParamUpdates) => {
      const newParams = new URLSearchParams(Array.from(searchParams.entries()));

      const paramDefaults: Record<keyof QueryParamUpdates, unknown> = {
        tab: DEFAULT_TAB_VALUE,
        category: defaultCategory,
        status: defaultStatus,
        sortBy: defaultSortBy,
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
      const newPath = `${pathname}${queryString ? `?${queryString}` : ''}`;
      router.replace(newPath, { scroll: false });
    },
    [
      searchParams,
      router,
      defaultCategory,
      defaultStatus,
      defaultSortBy,
      pathname,
    ],
  );

  const activeStatus = useMemo((): ListingStatus => {
    const statusParam = searchParams.get('status');
    if (statusParam === null) return defaultStatus;
    const parsed = ListingStatusSchema.safeParse(statusParam);
    if (parsed.success && parsed.data !== undefined) {
      return parsed.data;
    }
    return defaultStatus;
  }, [searchParams, defaultStatus]);

  const activeSortBy = useMemo((): ListingSortOption => {
    const sortByParam = searchParams.get('sortBy');
    if (sortByParam === null) return defaultSortBy;
    const parsed = ListingSortOptionSchema.safeParse(sortByParam);
    if (parsed.success && parsed.data !== undefined) {
      return parsed.data;
    }
    return defaultSortBy;
  }, [searchParams, defaultSortBy]);

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
      setInternalActiveTab(tabId);
      updateQueryParams({ tab: tabId });
      if (posthogEvent) {
        posthog.capture(posthogEvent);
      }
    },
    [updateQueryParams, posthog],
  );

  const handleCategoryChange = useCallback(
    (category: ListingCategory, posthogEvent?: string) => {
      setInternalActiveCategory(category);
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
    activeTab: internalActiveTab,
    activeCategory: internalActiveCategory,
    activeStatus,
    activeSortBy,
    activeOrder,
    handleTabChange,
    handleCategoryChange,
    handleStatusChange,
    handleSortChange,
  };
};
