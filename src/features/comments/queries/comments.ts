import { queryOptions } from '@tanstack/react-query';

import type { Comment } from '@/interface/comments';
import { api } from '@/lib/api';

interface CommentsResponse {
  result: Comment[];
  count: number;
  validUsernames: string[];
}

interface CommentsParams {
  refId: string;
  skip?: number;
  take?: number;
}

const fetchComments = async (
  params: CommentsParams,
): Promise<CommentsResponse> => {
  const { data } = await api.get(`/api/comment/${params.refId}`, {
    params: {
      skip: params.skip ?? 0,
      take: params.take ?? 10,
    },
  });
  return data;
};

export const commentsQuery = (params: CommentsParams) =>
  queryOptions({
    queryKey: ['comments', params.refId, params.skip, params.take, params],
    queryFn: () => fetchComments(params),
    staleTime: 60_000,
  });
