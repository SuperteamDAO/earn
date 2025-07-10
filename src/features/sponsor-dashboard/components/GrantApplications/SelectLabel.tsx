import { type SubmissionLabels } from '@prisma/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAtom, useSetAtom } from 'jotai';
import { ChevronDown } from 'lucide-react';
import { useMemo } from 'react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StatusPill } from '@/components/ui/status-pill';
import { api } from '@/lib/api';
import { cn } from '@/utils/cn';

import { isStateUpdatingAtom, selectedGrantApplicationAtom } from '../../atoms';
import { labelMenuOptionsGrants } from '../../constants';
import { type GrantApplicationsReturn } from '../../queries/applications';
import { colorMap } from '../../utils/statusColorMap';

interface Props {
  grantSlug: string;
}

export const SelectLabel = ({ grantSlug }: Props) => {
  const queryClient = useQueryClient();
  const [selectedApplication, setSelectedApplication] = useAtom(
    selectedGrantApplicationAtom,
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
  if (selectedApplication) {
    ({ bg, color, border } =
      colorMap[selectedApplication?.label as SubmissionLabels]);
  }

  const { mutate: updateLabel } = useMutation({
    mutationFn: ({ id, label }: { id: string; label: SubmissionLabels }) =>
      api.post(`/api/sponsor-dashboard/grants/update-label/`, {
        id,
        label,
      }),
    onSuccess: (_, variables) => {
      queryClient.setQueriesData(
        {
          predicate: (query) => {
            const queryKey = query.queryKey as unknown[];
            return (
              Array.isArray(queryKey) &&
              queryKey[0] === 'sponsor-applications' &&
              queryKey[1] === grantSlug
            );
          },
        },
        (old: GrantApplicationsReturn | undefined) => {
          if (!old) return old;
          const data = old.data.map((application) =>
            application.id === variables.id
              ? { ...application, label: variables.label }
              : application,
          );
          return {
            ...old,
            data,
          };
        },
      );

      setSelectedApplication((prev) =>
        prev && prev.id === variables.id
          ? { ...prev, label: variables.label }
          : prev,
      );
    },
    onMutate: () => {
      setLabelsUpdating(true);
    },
    onError: (e) => {
      console.log(e);
    },
    onSettled: (_, error, variables) => {
      setLabelsUpdating(false);
      if (error === null) {
        setSelectedApplication((prev) =>
          prev && prev.id === variables.id
            ? { ...prev, label: variables.label }
            : prev,
        );
      }
    },
  });

  const filterTriggerLabel = useMemo(() => {
    const applicationLabel = labelMenuOptionsGrants.find(
      (s) => s.value === selectedApplication?.label,
    );
    if (applicationLabel) return applicationLabel.label;
    else return selectedApplication?.label;
  }, [selectedApplication?.label]);

  const labelMenuOptionsGrantsPerAppl = useMemo(() => {
    if (selectedApplication?.applicationStatus !== 'Pending') {
      return labelMenuOptionsGrants.filter((s) => s.value !== 'Pending');
    }
    return labelMenuOptionsGrants;
  }, [selectedApplication]);

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
          {filterTriggerLabel || 'Select Option'}
          <ChevronDown className="ml-2 size-3" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        sideOffset={-1}
        className="w-full min-w-[110px] rounded-t-none px-0 pt-1.5"
      >
        {labelMenuOptionsGrantsPerAppl.map((option) => (
          <DropdownMenuItem
            key={option.value}
            className="cursor-pointer px-2 py-1 text-center text-[0.7rem]"
            onClick={() =>
              selectLabel(
                option.value as SubmissionLabels,
                selectedApplication?.id,
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
