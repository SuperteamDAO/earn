import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAtom } from 'jotai';
import { toast } from 'sonner';

import { type SubmissionWithUser } from '@/interface/submission';
import { api } from '@/lib/api';

import { type Listing, type Rewards } from '@/features/listings/types';

import { selectedSubmissionAtom } from '../atoms';

interface SubmissionUpdatePayload {
  id: string;
  isWinner: boolean;
  winnerPosition: number | null;
}

const BATCH_UPDATE_LIMIT = 50;

export const useToggleWinner = (bounty: Listing | undefined) => {
  const queryClient = useQueryClient();
  const [selectedSubmission, setSelectedSubmission] = useAtom(
    selectedSubmissionAtom,
  );

  return useMutation({
    mutationFn: async (allUpdates: SubmissionUpdatePayload[]) => {
      const updateBatches: SubmissionUpdatePayload[][] = [];
      for (let i = 0; i < allUpdates.length; i += BATCH_UPDATE_LIMIT) {
        updateBatches.push(allUpdates.slice(i, i + BATCH_UPDATE_LIMIT));
      }

      const batchPromises = updateBatches.map((batch) =>
        api.post(`/api/sponsor-dashboard/submission/toggle-winner/`, {
          submissions: batch,
        }),
      );

      await Promise.all(batchPromises);
      return { success: true };
    },
    onSuccess: (_) => {
      queryClient.invalidateQueries({
        queryKey: ['sponsor-submissions', bounty?.slug],
      });
    },
    onError: (error: any) => {
      queryClient.invalidateQueries({
        queryKey: ['sponsor-submissions', bounty?.slug],
      });
      toast.error(
        'An error occurred while assigning bonus spots. Please try again.',
      );
      console.error('Failed to toggle winners:', error);
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({
        queryKey: ['sponsor-submissions', bounty?.slug],
      });

      const previousSubmissions = queryClient.getQueryData<
        SubmissionWithUser[]
      >(['sponsor-submissions', bounty?.slug]);

      queryClient.setQueryData<SubmissionWithUser[]>(
        ['sponsor-submissions', bounty?.slug],
        (oldData) => {
          if (!oldData) return oldData;
          const updatesMap = new Map(
            variables.map((update) => [update.id, update]),
          );
          return oldData.map((submission) => {
            const update = updatesMap.get(submission.id);
            if (update) {
              if (selectedSubmission && update.id === selectedSubmission.id) {
                setSelectedSubmission({
                  ...submission,
                  isWinner: update.isWinner ?? submission.isWinner,
                  winnerPosition:
                    (update.winnerPosition as
                      | keyof Rewards
                      | undefined
                      | null) ?? undefined,
                });
              }
              return {
                ...submission,
                isWinner: update.isWinner ?? submission.isWinner,
                winnerPosition:
                  (update.winnerPosition as keyof Rewards | undefined | null) ??
                  undefined,
              };
            }
            return submission;
          });
        },
      );

      return { previousSubmissions };
    },
  });
};
