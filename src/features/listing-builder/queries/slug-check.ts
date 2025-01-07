import { queryOptions } from '@tanstack/react-query';

import { api } from '@/lib/api';
import { getURL } from '@/utils/validUrl';

interface SlugCheckParams {
  slug: string;
  check: boolean;
  id?: string | null;
}

export const fetchSlugCheck = async (params: SlugCheckParams) => {
  const newSlug = await api.get<{ slugExists?: boolean; slug?: string }>(
    `${getURL()}api/listings/check-slug`,
    {
      params: { ...params },
    },
  );
  return newSlug;
};

export const slugCheckQuery = (params: SlugCheckParams) =>
  queryOptions({
    queryKey: ['slug', params],
    queryFn: () => fetchSlugCheck(params),
    staleTime: 5 * 60 * 1000, // 5 mins
  });
