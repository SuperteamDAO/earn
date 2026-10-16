import { useInfiniteQuery } from '@tanstack/react-query';

import { api } from '@/lib/api';

import { type FeedDataProps, type FeedPostType } from '../types';

interface GetFeedParams {
  filter?: 'popular' | 'new';
  timePeriod?: string;
  isWinner?: boolean;
  take?: number;
  highlightId?: string;
  highlightType?: FeedPostType;
  takeOnlyType?: FeedPostType;
  userId?: string;
}

interface FeedResponse {
  data: FeedDataProps[];
  nextCursor: string | null;
}

const fetchFeed = async ({
  pageParam,
  ...params
}: GetFeedParams & { pageParam: string | null }) => {
  const queryParams: Record<string, unknown> = { ...params };
  if (pageParam) queryParams.cursor = pageParam;
  const { data } = await api.get<FeedResponse>('/api/feed/get', {
    params: queryParams,
  });
  return data;
};

export const useGetFeed = (params: GetFeedParams) => {
  return useInfiniteQuery({
    queryKey: ['feed', params],
    queryFn: ({ pageParam }) => fetchFeed({ ...params, pageParam }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
};
