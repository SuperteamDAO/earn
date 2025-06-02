import type { SubmissionLabels } from '@prisma/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAtom, useSetAtom } from 'jotai';
import { ChevronDown } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { SubmissionWithUser } from '@/interface/submission';
import { api } from '@/lib/api';
import { cn } from '@/utils/cn';

import { isStateUpdatingAtom, selectedSubmissionAtom } from '../../atoms';
import { labelMenuOptions } from '../../constants';
import { colorMap } from '../../utils/statusColorMap';

interface Props {
  listingSlug: string;
}

export const SelectLabel = ({ listingSlug }: Props) => {
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
    onError: (e) => {
      console.log(e);
    },
    onMutate: () => {
      setLabelsUpdating(true);
    },
    onSettled: () => {
      setLabelsUpdating(false);
    },
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="hover:border-brand-purple flex items-center rounded-md border border-slate-200 bg-transparent px-2 py-1 font-medium text-slate-500 capitalize hover:bg-transparent">
          <span
            className={cn(
              'inline-flex rounded-full px-3 py-0.5 text-center text-[10px] whitespace-nowrap capitalize',
              bg,
              color,
            )}
          >
            {selectedSubmission?.label || 'Select Option'}
          </span>
          <ChevronDown className="ml-2 size-3" />
        </button>
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
  );
};
