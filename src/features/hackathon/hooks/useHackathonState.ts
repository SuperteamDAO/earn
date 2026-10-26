'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { posthog } from 'posthog-js';
import { useCallback, useMemo, useTransition } from 'react';

import { startTopLoader } from '@/components/ui/toploader';

import {
  HackathonOrderDirectionSchema,
  HackathonSortOptionSchema,
  HackathonStatusSchema,
} from '../constants/schema';
import type {
  HackathonOrderDirection,
  HackathonSortOption,
  HackathonStatus,
} from './useHackathons';

// The schemas' defaults.
const DEFAULT_STATUS_VALUE: HackathonStatus = 'open';
const DEFAULT_ORDER_VALUE: HackathonOrderDirection = 'desc';
const DEFAULT_SORT_BY_VALUE: HackathonSortOption = 'Prize';
const defaultName = 'All';

type QueryParamUpdates = Partial<
  Record<
    'hackathon' | 'hackathonStatus' | 'hackathonSortBy' | 'hackathonOrder',
    string | null
  >
>;

const PARAM_KEYS = [
  'hackathon',
  'hackathonStatus',
  'hackathonSortBy',
  'hackathonOrder',
] as const;

export const useHackathonState = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParamsFromHook = useSearchParams();
  // The list is rendered on the server: a filter change loads the page
  // again for the new search params, showing the old list meanwhile.
  const [isPending, startTransition] = useTransition();

  const searchParams = useMemo(
    () => searchParamsFromHook ?? new URLSearchParams(),
    [searchParamsFromHook],
  );

  const updateQueryParams = useCallback(
    (updates: QueryParamUpdates) => {
      const newParams = new URLSearchParams(Array.from(searchParams.entries()));

      const paramDefaults: Record<keyof QueryParamUpdates, unknown> = {
        hackathon: defaultName,
        hackathonStatus: DEFAULT_STATUS_VALUE,
        hackathonSortBy: DEFAULT_SORT_BY_VALUE,
        hackathonOrder: DEFAULT_ORDER_VALUE,
      };

      for (const typedKey of PARAM_KEYS) {
        if (!(typedKey in updates)) continue;
        const value = updates[typedKey];
        const defaultValueForKey = paramDefaults[typedKey];

        if (
          value === null ||
          value === undefined ||
          value === defaultValueForKey
        ) {
          newParams.delete(typedKey);
        } else {
          newParams.set(typedKey, value);
        }
      }

      const queryString = newParams.toString();
      const newPath = `${pathname}${queryString ? `?${queryString}` : ''}`;
      startTopLoader();
      startTransition(() => {
        router.replace(newPath, { scroll: false });
      });
    },
    [searchParams, router, pathname],
  );

  const activeName = useMemo(
    (): string => searchParams.get('hackathon') ?? defaultName,
    [searchParams],
  );

  const activeStatus = useMemo((): HackathonStatus => {
    const statusParam = searchParams.get('hackathonStatus');
    if (statusParam === null) return DEFAULT_STATUS_VALUE;
    const parsed = HackathonStatusSchema.safeParse(statusParam);
    if (parsed.success && parsed.data !== undefined) {
      return parsed.data;
    }
    return DEFAULT_STATUS_VALUE;
  }, [searchParams]);

  const activeSortBy = useMemo((): HackathonSortOption => {
    const sortByParam = searchParams.get('hackathonSortBy');
    if (sortByParam === null) return DEFAULT_SORT_BY_VALUE;
    const parsed = HackathonSortOptionSchema.safeParse(sortByParam);
    if (parsed.success && parsed.data !== undefined) {
      return parsed.data;
    }
    return DEFAULT_SORT_BY_VALUE;
  }, [searchParams]);

  const activeOrder = useMemo((): HackathonOrderDirection => {
    const orderParam = searchParams.get('hackathonOrder');
    if (orderParam === null) return DEFAULT_ORDER_VALUE;
    const parsed = HackathonOrderDirectionSchema.safeParse(orderParam);
    if (parsed.success && parsed.data !== undefined) {
      return parsed.data;
    }
    return DEFAULT_ORDER_VALUE;
  }, [searchParams]);

  const handleNameChange = useCallback(
    (name: string, posthogEvent?: string) => {
      updateQueryParams({ hackathon: name });
      if (posthogEvent) {
        posthog.capture(posthogEvent);
      }
    },
    [updateQueryParams],
  );

  const handleStatusChange = useCallback(
    (status: HackathonStatus) => {
      updateQueryParams({ hackathonStatus: status });
    },
    [updateQueryParams],
  );

  const handleSortChange = useCallback(
    (sortBy: HackathonSortOption, order: HackathonOrderDirection) => {
      updateQueryParams({ hackathonSortBy: sortBy, hackathonOrder: order });
    },
    [updateQueryParams],
  );

  return {
    activeName,
    activeStatus,
    activeSortBy,
    activeOrder,
    handleNameChange,
    handleStatusChange,
    handleSortChange,
    isPending,
  };
};
