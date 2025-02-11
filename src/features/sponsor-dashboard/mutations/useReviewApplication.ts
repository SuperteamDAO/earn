import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAtom } from 'jotai';

import { type EvaluationResult } from '@/features/grants/types';

import { selectedGrantApplicationAtom } from '../atoms';
import { type GrantApplicationsReturn } from '../queries/applications';
import { type GrantApplicationWithUser } from '../types';

export const useReviewApplication = (slug: string) => {
  const queryClient = useQueryClient();
  const [selectedApplication, setSelectedApplication] = useAtom(
    selectedGrantApplicationAtom,
  );

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
      queryClient.setQueryData<GrantApplicationsReturn>(
        ['sponsor-applications', slug],
        (old) => {
          if (!old) return old;
          const data = old.data.map((appl) => {
            if (appl.id === application.id) {
              return {
                ...appl,
                ai: {
                  review: result.data,
                },
              };
            }
            return appl;
          });
          return {
            ...old,
            data,
          };
        },
      );
      if (application.id === selectedApplication?.id) {
        setSelectedApplication((prevAppl) => {
          if (prevAppl) {
            return {
              ...prevAppl,
              ai: {
                review: result.data,
              },
            };
          }
          return prevAppl;
        });
      }
      console.log('Reviewd application successfully', { id: application.id });
    },
  });
};
