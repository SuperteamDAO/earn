import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

import { type GrantApplicationAi } from '@/features/grants/types';

import { type GrantApplicationWithUser } from '../types';

export const useCommitReviews = (slug: string, grantId: string) => {
  const queryClient = useQueryClient();

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
      queryClient.setQueryData(
        ['sponsor-applications', slug],
        (old: GrantApplicationWithUser[]) => {
          if (!old) return old;
          return old.map((appl) => {
            const aiReview = (appl.ai as unknown as GrantApplicationAi)?.review;
            const commitedAi = {
              ...(!!aiReview ? { review: aiReview } : {}),
              commited: true,
            };
            return {
              ...appl,
              label: aiReview?.predictedLabel,
              notes: '• ' + aiReview?.shortNote,
              ai: commitedAi,
            };
          });
        },
      );
      console.log('Commited reviewed applications of grant with ID', grantId);
    },
  });
};
