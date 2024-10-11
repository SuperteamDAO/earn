import { SubmissionStatus } from '@prisma/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useSetAtom } from 'jotai';
import { toast } from 'sonner';

import { type SubmissionWithUser } from '@/interface/submission';

import { selectedSubmissionAtom, selectedSubmissionIdsAtom } from '..';

export const useRejectSubmissions = (slug: string) => {
  const queryClient = useQueryClient();
  const setSelectedSubmission = useSetAtom(selectedSubmissionAtom);
  const setSelectedSubmissionIds = useSetAtom(selectedSubmissionIdsAtom);

  return useMutation({
    mutationFn: async (submissionIds: string[]) => {
      const batchSize = 10;
      for (let i = 0; i < submissionIds.length; i += batchSize) {
        const batch = submissionIds.slice(i, i + batchSize);
        await axios.post(`/api/sponsor-dashboard/submission/reject`, {
          data: batch.map((a) => ({ id: a })),
        });
      }
    },
    onMutate: async (submissionIds) => {
      queryClient.setQueryData(['sponsor-submissions', slug], (old: any) => {
        if (!old) return old;
        return old.map((submission: SubmissionWithUser) =>
          submissionIds.includes(submission.id)
            ? {
                ...submission,
                status: SubmissionStatus.Rejected,
              }
            : submission,
        );
      });

      const updatedSubmission = queryClient
        .getQueryData<SubmissionWithUser[]>(['sponsor-submissions', slug])
        ?.find((submission) => submissionIds.includes(submission.id));

      setSelectedSubmission(updatedSubmission);
      setSelectedSubmissionIds(new Set());
    },
    onError: () => {
      toast.error(
        'An error occurred while rejecting submissions. Please try again.',
      );
    },
    onSuccess: (_, submissionIds) => {
      queryClient.setQueryData(['sponsor-submissions', slug], (old: any) => {
        if (!old) return old;
        return old.map((submission: SubmissionWithUser) =>
          submissionIds.includes(submission.id)
            ? {
                ...submission,
                status: SubmissionStatus.Rejected,
              }
            : submission,
        );
      });

      const updatedSubmission = queryClient
        .getQueryData<SubmissionWithUser[]>(['sponsor-submissions', slug])
        ?.find((submission) => submissionIds.includes(submission.id));

      setSelectedSubmission(updatedSubmission);
      setSelectedSubmissionIds(new Set());
      toast.success('Submissions rejected successfully');
    },
  });
};
