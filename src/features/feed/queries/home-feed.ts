import { queryOptions } from '@tanstack/react-query';

import { api } from '@/lib/api';
import { type SubmissionGetPayload } from '@/prisma/models/Submission';
import { type JsonResponse } from '@/utils/jsonResponse';

import { type homeFeedSelect } from '@/features/feed/constants/homeFeed';

type HomeFeed = JsonResponse<
  SubmissionGetPayload<{ select: typeof homeFeedSelect }>
>;

const fetchHomeFeed = async (): Promise<HomeFeed[]> => {
  const { data } = await api.get('/api/homepage/feed');
  return data;
};

export const homeFeedQuery = queryOptions({
  queryKey: ['home-feed'],
  queryFn: fetchHomeFeed,
  staleTime: 1000 * 60 * 60,
  gcTime: 1000 * 60 * 60 * 2,
});
