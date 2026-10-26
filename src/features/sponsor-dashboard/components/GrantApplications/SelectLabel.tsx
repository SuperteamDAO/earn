import { ChevronDown } from 'lucide-react';
import { useMemo } from 'react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StatusPill } from '@/components/ui/status-pill';
import { postJson } from '@/lib/fetch-json';
import type { SubmissionLabels } from '@/prisma/enums';
import { cn } from '@/utils/cn';

import type { GrantApplicationWithUser } from '../../types';
import { colorMap } from '../../utils/statusColorMap';
import { useGrantReview } from './GrantReviewContext';
import { grantLabelOptions } from './labels';

interface Props {
  grantSlug: string;
  application: GrantApplicationWithUser | undefined;
}

export const SelectLabel = ({ application: propApplication }: Props) => {
  const {
    selectedApplication: selectedApplicationAtomValue,
    setSelectedApplication,
    setApplications,
    setStateUpdating: setLabelsUpdating,
  } = useGrantReview();

  const targetApplication = propApplication || selectedApplicationAtomValue;

  const selectLabel = async (
    label: SubmissionLabels,
    id: string | undefined,
  ) => {
    if (!id) return;
    void updateLabel({ id, label });
  };

  let bg, color, border;
  if (targetApplication) {
    ({ bg, color, border } = colorMap[targetApplication.label]);
  }

  const updateLabel = async ({
    id,
    label,
  }: {
    id: string;
    label: SubmissionLabels;
  }) => {
    setLabelsUpdating(true);
    try {
      await postJson('/api/sponsor-dashboard/grants/update-label/', {
        id,
        label,
      });
      setApplications((prev) =>
        prev.map((app) => (app.id === id ? { ...app, label } : app)),
      );
      setLabelsUpdating(false);
      setSelectedApplication((prev) =>
        prev && prev.id === id ? { ...prev, label } : prev,
      );
    } catch (e) {
      console.error(e);
    } finally {
      setLabelsUpdating(false);
    }
  };

  const filterTriggerLabel = useMemo(() => {
    const applicationLabel = grantLabelOptions.find(
      (s) => s.value === targetApplication?.label,
    );
    if (applicationLabel) return applicationLabel.label;
    else return targetApplication?.label;
  }, [targetApplication?.label]);

  const labelMenuOptionsGrantsPerAppl = useMemo(() => {
    if (targetApplication?.applicationStatus !== 'Pending') {
      return grantLabelOptions.filter((s) => s.value !== 'Pending');
    }
    return grantLabelOptions;
  }, [targetApplication]);

  return (
    <div onClick={(e) => e.stopPropagation()}>
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
                void selectLabel(option.value, targetApplication?.id)
              }
            >
              <StatusPill
                color={colorMap[option.value].color}
                backgroundColor={colorMap[option.value].bg}
                borderColor={colorMap[option.value].border}
                className="w-fit text-[10px]"
              >
                {option.label}
              </StatusPill>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
