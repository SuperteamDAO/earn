import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAtom } from 'jotai';

import { api } from '@/lib/api';

import { type GrantApplicationAi } from '@/features/grants/types';
import { formatGrantApplicationAiReviewNotes } from '@/features/grants/utils/formatGrantApplicationAiReviewNotes';
import { convertTextToNotesHTML } from '@/features/sponsor-dashboard/utils/convertTextToNotesHTML';

import { selectedGrantApplicationAtom } from '../atoms';
import { type GrantApplicationWithUser } from '../types';

export const useCommitReviewsGrantApplications = (
  slug: string,
  grantId: string,
) => {
  const queryClient = useQueryClient();
  const [selectedApplication, setSelectedApplication] = useAtom(
    selectedGrantApplicationAtom,
  );

  return useMutation({
    mutationFn: async () => {
      return await api.post<GrantApplicationWithUser[]>(
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
              convertTextToNotesHTML(
                formatGrantApplicationAiReviewNotes(aiReview),
              ) || prevAppl.notes,
            ai: commitedAi,
          };
        }
        return prevAppl;
      });
    },
  });
};
