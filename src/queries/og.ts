import { queryOptions } from '@tanstack/react-query';

import { api } from '@/lib/api';

type OgImageMetadata = {
  title?: string;
  images?: Array<{ url: string }>;
};

type OgApiResponse = {
  result: OgImageMetadata | 'error';
};

type OgUpdateApiResponse = {
  success: true;
  imageUrl: string;
};

const fetchOgImage = async (
  url: string,
  type?: 'submission' | 'pow',
  id?: string,
): Promise<OgImageMetadata | 'error'> => {
  if (type && id) {
    try {
      const { data } = await api.post<OgUpdateApiResponse>('/api/og/update', {
        type,
        id,
      });
      return data.imageUrl === 'error'
        ? 'error'
        : { images: [{ url: data.imageUrl }] };
    } catch {
      // Logged-out viewers and update races still need the uncached OG result.
    }
  }

  const { data } = await api.get<OgApiResponse>('/api/og/get', {
    params: { url },
    timeout: 5000,
  });
  return data.result;
};

export const ogImageQuery = (
  url: string,
  type?: 'submission' | 'pow',
  id?: string,
) =>
  queryOptions({
    queryKey: ['ogImage', url, type, id],
    queryFn: () => fetchOgImage(url, type, id),
    retry: false,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
