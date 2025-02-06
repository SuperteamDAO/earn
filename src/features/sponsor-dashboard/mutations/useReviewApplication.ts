import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

import { type EvaluationResult } from '@/features/grants/types';

import { type GrantApplicationWithUser } from '../types';

export const useReviewApplication = (slug: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (application: GrantApplicationWithUser) => {
      return await axios.post<EvaluationResult>(
        '/api/sponsor-dashboard/grant-application/ai/review',
        {
          id: application.id,
        },
      );
    },
    onError: (error, application) => {
      console.log('Failed to review application', {
        id: application.id,
        error,
      });
    },
    onSuccess: (result, application) => {
      queryClient.setQueryData(
        ['sponsor-applications', slug],
        (old: GrantApplicationWithUser[]) => {
          if (!old) return old;
          return old.map((appl) => {
            if (appl.id === application.id) {
              return {
                ...appl,
                ai: {
                  review: result,
                },
              };
            }
            return appl;
          });
        },
      );
      console.log('Reviewd application successfully', { id: application.id });
    },
  });
};
