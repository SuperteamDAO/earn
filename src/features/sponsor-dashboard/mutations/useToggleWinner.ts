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

interface ToggleWinnerResponse {
  success: boolean;
  autoFixed?: boolean;
  autoFixedSubmissions?: string[];
}

const BATCH_UPDATE_LIMIT = 50;

export const useToggleWinner = (bounty: Listing | undefined) => {
  const queryClient = useQueryClient();
  const [selectedSubmission, setSelectedSubmission] = useAtom(
    selectedSubmissionAtom,
  );

  return useMutation({
    mutationFn: async (
      allUpdates: SubmissionUpdatePayload[],
    ): Promise<ToggleWinnerResponse> => {
      const updateBatches: SubmissionUpdatePayload[][] = [];
      for (let i = 0; i < allUpdates.length; i += BATCH_UPDATE_LIMIT) {
        updateBatches.push(allUpdates.slice(i, i + BATCH_UPDATE_LIMIT));
      }

      const batchPromises = updateBatches.map((batch) =>
        api.post(`/api/sponsor-dashboard/submission/toggle-winner/`, {
          submissions: batch,
        }),
      );

      const results = await Promise.all(batchPromises);

      // Check if any batch had autoFixed submissions
      const autoFixed = results.some((result) => result.data?.autoFixed);

      if (autoFixed) {
        toast.info(
          "A submission can't be both a winner and marked as spam — we've adjusted its status.",
        );
      }

      return {
        success: true,
        autoFixed,
      };
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
              // Handle the mutual exclusivity optimistically in the UI:
              // If marking as winner and has Spam label, change label to Unreviewed
              const updatedLabel =
                update.isWinner && submission.label === 'Spam'
                  ? 'Unreviewed'
                  : submission.label;

              if (selectedSubmission && update.id === selectedSubmission.id) {
                setSelectedSubmission({
                  ...submission,
                  isWinner: update.isWinner ?? submission.isWinner,
                  winnerPosition:
                    (update.winnerPosition as
                      | keyof Rewards
                      | undefined
                      | null) ?? undefined,
                  label: updatedLabel,
                });
              }
              return {
                ...submission,
                isWinner: update.isWinner ?? submission.isWinner,
                winnerPosition:
                  (update.winnerPosition as keyof Rewards | undefined | null) ??
                  undefined,
                label: updatedLabel,
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
