import { useInfiniteQuery } from '@tanstack/react-query';
import axios from 'axios';

import { type FeedDataProps, type FeedPostType } from '../types';

export * from './feed-post';

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

const fetchFeed = async ({
  pageParam,
  ...params
}: GetFeedParams & { pageParam: number }) => {
  const { data } = await axios.get<FeedDataProps[]>('/api/feed/get', {
    params: {
      ...params,
      skip: pageParam,
    },
  });
  return data;
};

export const useGetFeed = (params: GetFeedParams) => {
  return useInfiniteQuery({
    queryKey: ['feed', params],
    queryFn: ({ pageParam }) => fetchFeed({ ...params, pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 0
        ? undefined
        : allPages.length * (params.take ?? 15);
    },
  });
};
