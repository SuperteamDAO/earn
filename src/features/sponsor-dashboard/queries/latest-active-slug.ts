import { queryOptions } from '@tanstack/react-query';
import axios from 'axios';

const fetchLatestActiveSlug = async (): Promise<string> => {
  const { data } = await axios.get('/api/listings/latest-active-slug');
  return data;
};

export const latestActiveSlugQuery = queryOptions({
  queryKey: ['latestActiveSlug'],
  queryFn: fetchLatestActiveSlug,
});
