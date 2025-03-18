import { SubmissionStatus } from '@prisma/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSetAtom } from 'jotai';
import { toast } from 'sonner';

import { type SubmissionWithUser } from '@/interface/submission';
import { api } from '@/lib/api';

import { selectedSubmissionAtom, selectedSubmissionIdsAtom } from '../atoms';

export const useRejectSubmissions = (slug: string) => {
  const queryClient = useQueryClient();
  const setSelectedSubmission = useSetAtom(selectedSubmissionAtom);
  const setSelectedSubmissionIds = useSetAtom(selectedSubmissionIdsAtom);

  return useMutation({
    mutationFn: async (submissionIds: string[]) => {
      const batchSize = 10;
      for (let i = 0; i < submissionIds.length; i += batchSize) {
        const batch = submissionIds.slice(i, i + batchSize);
        await api.post(`/api/sponsor-dashboard/submission/reject`, {
          data: batch.map((a) => ({ id: a })),
        });
      }
      return submissionIds;
    },
    onMutate: async (submissionIds) => {
      await queryClient.cancelQueries({
        queryKey: ['sponsor-submissions', slug],
      });

      const previousSubmissions = queryClient.getQueryData<
        SubmissionWithUser[]
      >(['sponsor-submissions', slug]);

      queryClient.setQueryData(
        ['sponsor-submissions', slug],
        (old: SubmissionWithUser[] | undefined) => {
          if (!old) return old;
          return old.map((submission) =>
            submissionIds.includes(submission.id)
              ? {
                  ...submission,
                  status: SubmissionStatus.Rejected,
                }
              : submission,
          );
        },
      );

      setSelectedSubmissionIds(new Set());

      return { previousSubmissions };
    },
    onError: () => {
      toast.error(
        'An error occurred while rejecting submissions. Please try again.',
      );
    },
    onSuccess: (submissionIds) => {
      toast.success('Submissions rejected successfully');

      const submissions = queryClient.getQueryData<SubmissionWithUser[]>([
        'sponsor-submissions',
        slug,
      ]);
      if (submissions) {
        const nextAvailableSubmission = submissions.find(
          (sub) =>
            !submissionIds.includes(sub.id) &&
            sub.status !== SubmissionStatus.Rejected,
        );
        setSelectedSubmission(nextAvailableSubmission || undefined);
      }
    },
  });
};
