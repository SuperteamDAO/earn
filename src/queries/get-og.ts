import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const fetchOgImage = async (url: string): Promise<string | null> => {
  const { data } = await axios.get('/api/og/get', { params: { url } });
  return data;
};

export const useOgImage = (url: string | undefined) => {
  return useQuery({
    queryKey: ['ogImage', url],
    queryFn: () => fetchOgImage(url!),
    enabled: !!url,
  });
};
