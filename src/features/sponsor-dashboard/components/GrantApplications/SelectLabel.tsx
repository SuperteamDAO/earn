import { type SubmissionLabels } from '@prisma/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAtom } from 'jotai';
import { ChevronDown } from 'lucide-react';
import { useMemo } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { api } from '@/lib/api';
import { cn } from '@/utils/cn';

import { selectedGrantApplicationAtom } from '../../atoms';
import { labelMenuOptions } from '../../constants';
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

  const labelMenuOptionsGrants = useMemo(
    () => [
      ...labelMenuOptions.filter((s) => !['Spam'].includes(s.value)),
      {
        label: 'Low Quality',
        value: 'Low_Quality',
      },
    ],
    [],
  );

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
      queryClient.setQueryData<GrantApplicationsReturn>(
        ['sponsor-applications', grantSlug],
        (old) => {
          if (!old) return old;
          const data = old?.data.map((application) =>
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
    onError: (e) => {
      console.log(e);
    },
  });

  const filterTriggerLabel = useMemo(() => {
    const applicationLabel = labelMenuOptionsGrants.find(
      (s) => s.value === selectedApplication?.label,
    );
    if (applicationLabel) return applicationLabel.label;
    else return selectedApplication?.label;
  }, [selectedApplication?.label]);

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
            {filterTriggerLabel || 'Select Option'}
          </span>
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="border-slate-300">
        {labelMenuOptionsGrants.map((option) => (
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
