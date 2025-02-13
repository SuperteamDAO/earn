import { type SubmissionLabels } from '@prisma/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAtom } from 'jotai';
import { ChevronDown } from 'lucide-react';

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

import { selectedSubmissionAtom } from '../../atoms';
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
    onSuccess: (_, variables) => {
      queryClient.setQueryData<SubmissionWithUser[]>(
        ['sponsor-submissions', listingSlug],
        (old) =>
          old?.map((submission) =>
            submission.id === variables.id
              ? { ...submission, label: variables.label }
              : submission,
          ),
      );

      setSelectedSubmission((prev) =>
        prev && prev.id === variables.id
          ? { ...prev, label: variables.label }
          : prev,
      );
    },
    onError: (e) => {
      console.log(e);
    },
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="hover:border-brand-purple border border-slate-300 bg-transparent font-medium text-slate-500 capitalize hover:bg-transparent"
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
