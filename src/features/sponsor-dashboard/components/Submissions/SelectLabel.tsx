import { SubmissionLabels } from '@prisma/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAtom, useSetAtom } from 'jotai';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { type SubmissionWithUser } from '@/interface/submission';
import { api } from '@/lib/api';
import { cn } from '@/utils/cn';

import { isStateUpdatingAtom, selectedSubmissionAtom } from '../../atoms';
import { labelMenuOptions } from '../../constants';
import { colorMap } from '../../utils/statusColorMap';
import { SpamConfirmationDialog } from './SpamConfirmationDialog';

interface Props {
  listingSlug: string;
}

interface UpdateLabelResponse {
  data: {
    id: string;
    label: SubmissionLabels;
    autoFixed?: boolean;
    [key: string]: any;
  };
}

export const SelectLabel = ({ listingSlug }: Props) => {
  const queryClient = useQueryClient();
  const [selectedSubmission, setSelectedSubmission] = useAtom(
    selectedSubmissionAtom,
  );
  const setLabelsUpdating = useSetAtom(isStateUpdatingAtom);
  const [isSpamDialogOpen, setIsSpamDialogOpen] = useState(false);
  const [isCheckingSpam, setIsCheckingSpam] = useState(false);
  const [pendingSpamLabel, setPendingSpamLabel] = useState<{
    id: string;
    label: SubmissionLabels;
  } | null>(null);

  const selectLabel = async (
    label: SubmissionLabels,
    id: string | undefined,
  ) => {
    if (!id) return;

    if (label === 'Spam') {
      setPendingSpamLabel({ id, label });
      checkIfFirstSpamSubmission(id);
    } else {
      updateLabel({ id, label });
    }
  };

  const checkIfFirstSpamSubmission = async (id: string) => {
    setIsCheckingSpam(true);
    try {
      const response = await api.get(
        `/api/sponsor-dashboard/${listingSlug}/submissions`,
      );
      const submissions = response.data || [];
      const spamSubmissions = submissions.filter(
        (sub: any) => sub.label === 'Spam',
      );

      if (spamSubmissions.length === 0) {
        setIsSpamDialogOpen(true);
      } else {
        updateLabel({ id, label: SubmissionLabels.Spam });
      }
    } catch (error) {
      console.error('Error checking submissions:', error);

      setIsSpamDialogOpen(true);
    } finally {
      setIsCheckingSpam(false);
    }
  };

  const handleSpamConfirm = (id: string, label: SubmissionLabels) => {
    updateLabel({ id, label });
  };

  let bg, color;
  if (selectedSubmission) {
    ({ bg, color } = colorMap[selectedSubmission?.label as SubmissionLabels]);
  }

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

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="hover:border-brand-purple border border-slate-300 bg-transparent font-medium text-slate-500 capitalize hover:bg-transparent"
            disabled={isCheckingSpam}
          >
            <span
              className={cn(
                'inline-flex w-full rounded-full px-3 py-0.5 text-center text-xs whitespace-nowrap capitalize',
                bg,
                color,
              )}
            >
              {selectedSubmission?.label || 'Select Option'}
            </span>
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="border-slate-300">
          {labelMenuOptions.map((option) => (
            <DropdownMenuItem
              key={option.value}
              className="focus:bg-slate-100"
              onClick={() =>
                selectLabel(
                  option.value as SubmissionLabels,
                  selectedSubmission?.id,
                )
              }
              disabled={isCheckingSpam}
            >
              <span
                className={cn(
                  'inline-flex w-full rounded-full px-2 text-center text-[10px] whitespace-nowrap capitalize',
                  colorMap[option.value as keyof typeof colorMap].bg,
                  colorMap[option.value as keyof typeof colorMap].color,
                )}
              >
                {option.label}
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <SpamConfirmationDialog
        isOpen={isSpamDialogOpen}
        onClose={() => {
          setIsSpamDialogOpen(false);
          setPendingSpamLabel(null);
        }}
        submissionId={pendingSpamLabel?.id}
        listingSlug={listingSlug}
        onConfirm={handleSpamConfirm}
      />
    </>
  );
};
