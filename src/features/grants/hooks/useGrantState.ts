import { useRouter, useSearchParams } from 'next/navigation';
import posthog from 'posthog-js';
import { useCallback, useMemo } from 'react';

import { GrantCategorySchema } from '../constants/schema';

const defaultCategory = GrantCategorySchema.parse(undefined);

type QueryParamUpdates = Partial<Record<'grantCategory', string | null>>;

export const useGrantState = () => {
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
        grantCategory: defaultCategory,
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

  const activeCategory = useMemo(
    (): string => searchParams.get('grantCategory') ?? defaultCategory,
    [searchParams, defaultCategory],
  );

  const handleCategoryChange = useCallback(
    (category: string, posthogEvent?: string) => {
      updateQueryParams({ grantCategory: category });
      if (posthogEvent) {
        posthog.capture(posthogEvent);
      }
    },
    [updateQueryParams, posthog],
  );

  return {
    activeCategory,
    handleCategoryChange,
  };
};
