import { useRouter, useSearchParams } from 'next/navigation';
import { usePostHog } from 'posthog-js/react';
import { useCallback, useMemo } from 'react';

import {
  HackathonOrderDirectionSchema,
  HackathonSchema,
  HackathonSortOptionSchema,
  HackathonStatusSchema,
} from '../constants/schema';
import {
  type HackathonOrderDirection,
  type HackathonSortOption,
  type HackathonStatus,
} from './useHackathons';

const DEFAULT_STATUS_VALUE: HackathonStatus =
  HackathonStatusSchema._def.defaultValue();
const DEFAULT_ORDER_VALUE: HackathonOrderDirection =
  HackathonOrderDirectionSchema._def.defaultValue();
const DEFAULT_SORT_BY_VALUE: HackathonSortOption =
  HackathonSortOptionSchema._def.defaultValue();
const defaultName = HackathonSchema._def.defaultValue();

type QueryParamUpdates = Partial<
  Record<
    'hackathon' | 'hackathonStatus' | 'hackathonSortBy' | 'hackathonOrder',
    string | null
  >
>;

export const useHackathonState = () => {
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
        hackathon: defaultName,
        hackathonStatus: DEFAULT_STATUS_VALUE,
        hackathonSortBy: DEFAULT_SORT_BY_VALUE,
        hackathonOrder: DEFAULT_ORDER_VALUE,
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
    [searchParams, router, defaultName],
  );

  const activeName = useMemo(
    (): string => searchParams.get('hackathon') ?? defaultName,
    [searchParams, defaultName],
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
    [updateQueryParams, posthog],
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
  };
};
