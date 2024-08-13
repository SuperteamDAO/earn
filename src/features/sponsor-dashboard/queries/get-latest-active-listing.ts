import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export const useLatestActiveSlug = (enabled: boolean) => {
  return useQuery({
    queryKey: ['latestActiveSlug'],
    queryFn: async () => {
      const { data } = await axios.get('/api/listings/latest-active-slug');
      return data.slug;
    },
    enabled,
  });
};
