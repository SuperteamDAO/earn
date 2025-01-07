import { queryOptions } from '@tanstack/react-query';

import { api } from '@/lib/api';

const fetchLatestActiveSlug = async (): Promise<string> => {
  const { data } = await api.get('/api/listings/latest-active-slug');
  return data;
};

export const latestActiveSlugQuery = queryOptions({
  queryKey: ['latestActiveSlug'],
  queryFn: fetchLatestActiveSlug,
});
