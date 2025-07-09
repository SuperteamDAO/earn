import { SubmissionLabels } from '@prisma/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAtom, useSetAtom } from 'jotai';
import { LucideFlag } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import type { SubmissionWithUser } from '@/interface/submission';
import { api } from '@/lib/api';

import { isStateUpdatingAtom, selectedSubmissionAtom } from '../../atoms';
import { useRejectSubmissions } from '../../mutations/useRejectSubmissions';
import { SpamConfirmationDialog } from './SpamConfirmationDialog';

interface Props {
  listingSlug: string;
  isMultiSelectOn: boolean;
}

interface UpdateLabelResponse {
  data: {
    id: string;
    label: SubmissionLabels;
    autoFixed?: boolean;
    [key: string]: any;
  };
}

export const SpamButton = ({ listingSlug, isMultiSelectOn }: Props) => {
  const queryClient = useQueryClient();
  const [selectedSubmission, setSelectedSubmission] = useAtom(
    selectedSubmissionAtom,
  );
  const setLabelsUpdating = useSetAtom(isStateUpdatingAtom);
  const [isSpamDialogOpen, setIsSpamDialogOpen] = useState(false);
  const [pendingSpamLabel, setPendingSpamLabel] = useState<{
    id: string;
    label: SubmissionLabels;
  } | null>(null);

  const rejectSubmissions = useRejectSubmissions(listingSlug);

  const handleSpamClick = async () => {
    if (!selectedSubmission?.id) return;

    setPendingSpamLabel({
      id: selectedSubmission.id,
      label: SubmissionLabels.Spam,
    });
    setIsSpamDialogOpen(true);
  };

  const handleSpamConfirm = (id: string, label: SubmissionLabels) => {
    updateLabel({ id, label });
  };

  const { mutate: updateLabel } = useMutation({
    mutationFn: ({ id, label }: { id: string; label: SubmissionLabels }) =>
      api.post(`/api/sponsor-dashboard/submission/update-label/`, {
        id,
        label,
      }),
    onSuccess: (
      response: UpdateLabelResponse,
      variables: { id: string; label: SubmissionLabels },
    ) => {
      setLabelsUpdating(false);

      const { autoFixed } = response.data || {};
      if (autoFixed) {
        toast.info(
          "A submission can't be both a winner and marked as spam — we've adjusted its status.",
        );
      }

      if (variables.label === SubmissionLabels.Spam) {
        rejectSubmissions.mutate([variables.id]);
      }

      queryClient.setQueryData<SubmissionWithUser[]>(
        ['sponsor-submissions', listingSlug],
        (old) => {
          if (!old) return old;
          return old.map((submission) => {
            if (submission.id === variables.id) {
              if (
                variables.label === 'Spam' &&
                submission.isWinner &&
                autoFixed
              ) {
                return {
                  ...submission,
                  label: variables.label,
                  isWinner: false,
                  winnerPosition: undefined,
                };
              }
              return { ...submission, label: variables.label };
            }
            return submission;
          });
        },
      );

      setSelectedSubmission((prev) => {
        if (prev && prev.id === variables.id) {
          if (variables.label === 'Spam' && prev.isWinner && autoFixed) {
            return {
              ...prev,
              label: variables.label,
              isWinner: false,
              winnerPosition: undefined,
            };
          }
          return { ...prev, label: variables.label };
        }
        return prev;
      });
    },
    onMutate: () => {
      setLabelsUpdating(true);
    },
    onError: (e) => {
      console.log(e);
    },
    onSettled: () => {
      setLabelsUpdating(false);
    },
  });

  const isMarkedAsSpam = selectedSubmission?.label === SubmissionLabels.Spam;

  return (
    <>
      <Button
        variant="destructive"
        className={`rounded-lg border disabled:opacity-100 ${
          isMarkedAsSpam
            ? 'border-orange-300 bg-orange-100 text-orange-600 hover:bg-orange-200'
            : 'border-orange-200 bg-orange-50 text-orange-500 hover:bg-orange-100 disabled:opacity-70'
        }`}
        onClick={handleSpamClick}
        disabled={isMarkedAsSpam || isMultiSelectOn}
      >
        <LucideFlag className="size-1 text-orange-500" />
        {isMarkedAsSpam ? 'Marked as Spam' : 'Spam'}
      </Button>

      <SpamConfirmationDialog
        isOpen={isSpamDialogOpen}
        onClose={() => {
          setIsSpamDialogOpen(false);
          setPendingSpamLabel(null);
        }}
        submissionId={pendingSpamLabel?.id}
        onConfirm={handleSpamConfirm}
      />
    </>
  );
};
