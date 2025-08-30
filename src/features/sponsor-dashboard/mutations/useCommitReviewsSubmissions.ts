import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAtom } from 'jotai';

import { type SubmissionWithUser } from '@/interface/submission';
import { api } from '@/lib/api';

import { selectedSubmissionAtom } from '../atoms';

export const useCommitReviewsSubmissions = (
  slug: string,
  listingId: string,
) => {
  const queryClient = useQueryClient();
  const [selectedSubmission, setSelectedSubmission] = useAtom(
    selectedSubmissionAtom,
  );

  return useMutation({
    mutationFn: async () => {
      return await api.post<SubmissionWithUser[]>(
        '/api/sponsor-dashboard/submissions/ai/commit-reviewed',
        {
          id: listingId,
        },
      );
    },
    onError: (error) => {
      console.log('Failed to review submissions', {
        slug,
        listingId,
        error,
      });
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({
        predicate: (query) => {
          return (
            query.queryKey.includes('sponsor-submissions') &&
            query.queryKey.includes(slug)
          );
        },
      });

      if (!selectedSubmission) return;

      const updatedSubmission = response.data?.find(
        (submission: SubmissionWithUser) =>
          submission.id === selectedSubmission.id,
      );

      if (!updatedSubmission) return;

      setSelectedSubmission((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          label: updatedSubmission.label,
          notes: updatedSubmission.notes,
          ai: updatedSubmission.ai,
        };
      });
    },
  });
};
