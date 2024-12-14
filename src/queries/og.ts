import { queryOptions } from '@tanstack/react-query';
import axios from 'axios';
import { type unfurl } from 'unfurl.js';

type OpenGraph = Pick<
  Awaited<ReturnType<typeof unfurl>>,
  'open_graph'
>['open_graph'];

type OgApiResponse = {
  result: OpenGraph | 'error';
};

const fetchOgImage = async (url: string): Promise<OpenGraph | 'error'> => {
  const { data } = await axios.get<OgApiResponse>('/api/og/get', {
    params: { url },
    timeout: 5000,
  });
  return data.result;
};

export const ogImageQuery = (url: string) =>
  queryOptions({
    queryKey: ['ogImage', url, url!],
    queryFn: () => fetchOgImage(url!),
    retry: false,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
