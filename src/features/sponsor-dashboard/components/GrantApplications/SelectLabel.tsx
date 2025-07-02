import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAtom, useSetAtom } from 'jotai';
import { ChevronDown } from 'lucide-react';
import { useMemo } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { type SubmissionLabels } from '@/interface/prisma/enums';
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

  let bg, color;
  if (selectedApplication) {
    ({ bg, color } = colorMap[selectedApplication?.label as SubmissionLabels]);
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
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="hover:border-brand-purple border border-slate-300 bg-transparent font-normal text-slate-500 capitalize hover:bg-transparent"
        >
          <span
            className={cn(
              'inline-flex w-full rounded-full px-3 py-0.5 text-center text-xs whitespace-nowrap capitalize',
              bg,
              color,
            )}
          >
            {filterTriggerLabel || 'Select Option'}
          </span>
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="border-slate-300">
        {labelMenuOptionsGrantsPerAppl.map((option) => (
          <DropdownMenuItem
            key={option.value}
            className="focus:bg-slate-100"
            onClick={() =>
              selectLabel(
                option.value as SubmissionLabels,
                selectedApplication?.id,
              )
            }
          >
            <span
              className={cn(
                'inline-flex w-fit rounded-full px-2 text-center text-[10px] whitespace-nowrap capitalize',
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
