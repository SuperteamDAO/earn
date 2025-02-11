import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAtom } from 'jotai';

import { type GrantApplicationAi } from '@/features/grants/types';

import { selectedGrantApplicationAtom } from '../atoms';
import { type GrantApplicationWithUser } from '../types';

export const useCommitReviews = (slug: string, grantId: string) => {
  const queryClient = useQueryClient();
  const [selectedApplication, setSelectedApplication] = useAtom(
    selectedGrantApplicationAtom,
  );

  return useMutation({
    mutationFn: async () => {
      return await axios.post<GrantApplicationWithUser[]>(
        '/api/sponsor-dashboard/grant-application/ai/commit-reviewed',
        {
          id: grantId,
        },
      );
    },
    onError: (error) => {
      console.log('Failed to review application', {
        slug,
        grantId,
        error,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) => {
          return (
            query.queryKey.includes('sponsor-applications') &&
            query.queryKey.includes(slug)
          );
        },
      });
      const aiReview = (selectedApplication?.ai as GrantApplicationAi)?.review;
      const commitedAi = {
        ...(!!aiReview ? { review: aiReview } : {}),
        commited: true,
      };
      setSelectedApplication((prevAppl) => {
        if (prevAppl) {
          return {
            ...prevAppl,
            label: aiReview?.predictedLabel || prevAppl.label,
            notes:
              aiReview?.shortNote
                .split(/(?<=[.!?])\s+/)
                .filter((sentence) => sentence.trim().length > 0)
                .map((sentence) => `• ${sentence.trim()}`)
                .join('\n') || prevAppl.notes,
            ai: commitedAi,
          };
        }
        return prevAppl;
      });
      console.log('Commited reviewed applications of grant with ID', grantId);
    },
  });
};
