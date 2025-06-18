import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usePostHog } from 'posthog-js/react';
import { toast } from 'sonner';

import { api } from '@/lib/api';

interface CommentLikeMutationData {
  commentId: string;
}

interface CommentLikeResponse {
  id: string;
  like: Array<{ id: string; date: number }>;
  likeCount: number;
}

export const useCommentLike = () => {
  const queryClient = useQueryClient();
  const posthog = usePostHog();

  return useMutation<CommentLikeResponse, Error, CommentLikeMutationData>({
    mutationFn: async ({ commentId }) => {
      const response = await api.post('/api/comment/like', { id: commentId });
      return response.data;
    },
    onSuccess: (data, { commentId }) => {
      posthog.capture('comment_like', {
        commentId,
        liked: data.like.length > 0,
      });

      queryClient.invalidateQueries({
        queryKey: ['comments'],
      });
    },
    onError: (error) => {
      console.error('Failed to update comment like:', error);
      toast.error('Failed to update like, please try again later');
    },
  });
};
