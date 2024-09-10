import { queryOptions } from '@tanstack/react-query';
import axios from 'axios';
import { type unfurl } from 'unfurl.js';

type OpenGraph = Pick<
  Awaited<ReturnType<typeof unfurl>>,
  'open_graph'
>['open_graph'];
const fetchOgImage = async (url: string): Promise<OpenGraph> => {
  const { data } = await axios.get<{ result: OpenGraph }>('/api/og/get', {
    params: { url },
  });
  return data.result;
};

export const ogImageQuery = (url: string) =>
  queryOptions({
    queryKey: ['ogImage', url],
    queryFn: () => fetchOgImage(url!),
    enabled: !!url,
    retry: false,
  });
