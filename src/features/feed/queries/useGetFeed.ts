import { useInfiniteQuery } from '@tanstack/react-query';

import { api } from '@/lib/api';

import { type FeedDataProps, type FeedPostType } from '../types';

export interface GetFeedParams {
  readonly filter?: 'popular' | 'new' | undefined;
  readonly timePeriod?: string | undefined;
  readonly isWinner?: boolean | undefined;
  readonly take?: number | undefined;
  readonly highlightId?: string | undefined;
  readonly highlightType?: FeedPostType | undefined;
  readonly takeOnlyType?: FeedPostType | undefined;
  readonly userId?: string | undefined;
}

export interface FetchFeedParams extends GetFeedParams {
  readonly pageParam: string | null;
}

export interface FeedResponse {
  readonly data: FeedDataProps[];
  readonly nextCursor: string | null;
}

const fetchFeed = async ({
  pageParam,
  ...params
}: FetchFeedParams): Promise<FeedResponse> => {
  const queryParams: Record<string, unknown> = { ...params };
  if (pageParam) {
    queryParams.cursor = pageParam;
  }
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
