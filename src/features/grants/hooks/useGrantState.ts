'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { posthog } from 'posthog-js';
import { useCallback, useOptimistic, useTransition } from 'react';

import { startTopLoader } from '@/components/ui/toploader';

// The grants list's category lives in the URL (`grantCategory`): a change
// navigates and the server renders the list again; the pill lights up at
// once.
export const useGrantState = (category: string) => {
  const router = useRouter();
  const pathname = usePathname() ?? '';
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [activeCategory, setActiveCategory] = useOptimistic(category);

  const handleCategoryChange = useCallback(
    (next: string, posthogEvent?: string) => {
      const params = new URLSearchParams(searchParams?.toString() ?? '');
      if (next === 'All') params.delete('grantCategory');
      else params.set('grantCategory', next);
      const query = params.toString();
      startTopLoader();
      startTransition(() => {
        setActiveCategory(next);
        router.replace(`${pathname}${query ? `?${query}` : ''}`, {
          scroll: false,
        });
      });
      if (posthogEvent) posthog.capture(posthogEvent);
    },
    [searchParams, pathname, router, setActiveCategory],
  );

  return { activeCategory, handleCategoryChange };
};
