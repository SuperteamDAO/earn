import { queryOptions } from '@tanstack/react-query';
import axios from 'axios';

import { type FeedDataProps, type FeedPostType } from '../types';

interface FeedPostParams {
  type: FeedPostType;
  id: string;
}

const fetchFeedPost = async (
  params: FeedPostParams,
): Promise<FeedDataProps[]> => {
  const { data } = await axios.get<FeedDataProps[]>(
    `/api/feed/${params.type}/${params.id}/get`,
    {},
  );
  return data;
};

export const fetchFeedPostQuery = (params: FeedPostParams) =>
  queryOptions({
    queryKey: ['feed-post', params],
    queryFn: () => fetchFeedPost(params),
  });
