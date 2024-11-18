import { queryOptions } from '@tanstack/react-query';
import axios from 'axios';

import { getURL } from '@/utils';

interface SlugCheckParams {
  slug: string;
  check: boolean;
  id?: string;
}

export const fetchSlugCheck = async (params: SlugCheckParams) => {
  const newSlug = await axios.get<{ slugExists?: boolean; slug?: string }>(
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
