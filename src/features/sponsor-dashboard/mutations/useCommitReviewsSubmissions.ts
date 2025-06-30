import { type SubmissionLabels } from '@prisma/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAtom } from 'jotai';

import { type SubmissionWithUser } from '@/interface/submission';
import { api } from '@/lib/api';

import { type ProjectApplicationAi } from '@/features/listings/types';

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
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) => {
          return (
            query.queryKey.includes('sponsor-submissions') &&
            query.queryKey.includes(slug)
          );
        },
      });
      const aiReview = (selectedSubmission?.ai as ProjectApplicationAi)?.review;
      const commitedAi = {
        ...(!!aiReview ? { review: aiReview } : {}),
        commited: true,
      };
      setSelectedSubmission((prevAppl) => {
        let correctedLabel: SubmissionLabels = prevAppl?.label || 'Unreviewed';
        if (aiReview?.predictedLabel === 'High_Quality')
          correctedLabel = 'Shortlisted';
        if (
          aiReview?.predictedLabel === 'Mid_Quality' ||
          aiReview?.predictedLabel === 'Low_Quality'
        )
          correctedLabel = 'Reviewed';
        if (prevAppl) {
          return {
            ...prevAppl,
            label: correctedLabel,
            notes:
              aiReview?.shortNote
                ?.split(/(?<=[.!?])\s+/)
                .filter((sentence) => sentence.trim().length > 0)
                .map((sentence) => `• ${sentence.trim()}`)
                .join('\n') || prevAppl.notes,
            ai: commitedAi,
          };
        }
        return prevAppl;
      });
    },
  });
};
