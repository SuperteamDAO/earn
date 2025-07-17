import type { BountyType, SubmissionLabels } from '@prisma/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAtom, useSetAtom } from 'jotai';
import { ChevronDown } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StatusPill } from '@/components/ui/status-pill';
import type { SubmissionWithUser } from '@/interface/submission';
import { api } from '@/lib/api';
import { cn } from '@/utils/cn';

import { isStateUpdatingAtom, selectedSubmissionAtom } from '../../atoms';
import { labelMenuOptions } from '../../constants';
import { colorMap } from '../../utils/statusColorMap';

interface Props {
  listingSlug: string;
  type: BountyType | 'grant' | undefined;
}

export const SelectLabel = ({ listingSlug, type }: Props) => {
  const queryClient = useQueryClient();
  const [selectedSubmission, setSelectedSubmission] = useAtom(
    selectedSubmissionAtom,
  );
  const setLabelsUpdating = useSetAtom(isStateUpdatingAtom);

  const selectLabel = async (
    label: SubmissionLabels,
    id: string | undefined,
  ) => {
    if (!id) return;
    updateLabel({ id, label });
  };

  let bg, color, border;
  if (selectedSubmission) {
    ({ bg, color, border } =
      colorMap[selectedSubmission?.label as SubmissionLabels]);
  }

  const { mutate: updateLabel } = useMutation({
    mutationFn: ({ id, label }: { id: string; label: SubmissionLabels }) =>
      api.post(`/api/sponsor-dashboard/submission/update-label/`, {
        id,
        label,
      }),
    onSuccess: (
      _response,
      variables: { id: string; label: SubmissionLabels },
    ) => {
      setLabelsUpdating(false);

      queryClient.setQueryData<SubmissionWithUser[]>(
        ['sponsor-submissions', listingSlug],
        (old) => {
          if (!old) return old;
          return old.map((submission) => {
            if (submission.id === variables.id) {
              return { ...submission, label: variables.label };
            }
            return submission;
          });
        },
      );

      setSelectedSubmission((prev) => {
        if (prev && prev.id === variables.id) {
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild className="min-w-[110px]">
        <button
          className={cn(
            'flex w-full items-center justify-between rounded-lg border border-slate-200 bg-transparent px-2 py-1 text-xs font-medium text-slate-500 capitalize transition-all duration-300 ease-in-out hover:border-slate-200 data-[state=open]:rounded-b-none data-[state=open]:border-slate-200',
            color,
            bg,
            border,
          )}
        >
          {labelMenuOptions(type).find(
            (option) => option.value === selectedSubmission?.label,
          )?.label || 'Select Option'}
          <ChevronDown className="ml-2 size-3" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        sideOffset={-1}
        className="w-full min-w-[110px] rounded-t-none px-0 pt-1.5"
      >
        {labelMenuOptions(type).map((option) => (
          <DropdownMenuItem
            key={option.value}
            className="cursor-pointer px-1.5 py-1 text-center text-[0.7rem]"
            onClick={() =>
              selectLabel(
                option.value as SubmissionLabels,
                selectedSubmission?.id,
              )
            }
          >
            <StatusPill
              color={colorMap[option.value as SubmissionLabels].color}
              backgroundColor={colorMap[option.value as SubmissionLabels].bg}
              borderColor={colorMap[option.value as SubmissionLabels].border}
              className="w-fit text-[10px]"
            >
              {option.label}
            </StatusPill>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
