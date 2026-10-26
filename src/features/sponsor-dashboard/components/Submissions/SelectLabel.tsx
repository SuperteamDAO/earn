'use client';

import { ChevronDown } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StatusPill } from '@/components/ui/status-pill';
import { SubmissionLabels, type BountyType } from '@/prisma/enums';
import { cn } from '@/utils/cn';

import { labelMenuOptions } from '../../constants';
import type { ReviewSubmission } from '../../utils/review-rules';
import { colorMap } from '../../utils/statusColorMap';
import { useReview, useUpdateLabel } from './review-state';

interface Props {
  type: BountyType | 'grant' | undefined;
  submission: ReviewSubmission | undefined;
}

const isLabel = (value: string): value is SubmissionLabels =>
  Object.values<string>(SubmissionLabels).includes(value);

const colorsOf = (value: string) =>
  isLabel(value) ? colorMap[value] : { color: '', bg: '', border: '' };

export const SelectLabel = ({ type, submission: propSubmission }: Props) => {
  const { selected, setUpdating } = useReview();
  const updateLabel = useUpdateLabel();

  const targetSubmission = propSubmission || selected;

  const selectLabel = (label: string, id: string | undefined) => {
    if (!id || !isLabel(label)) return;
    setUpdating(true);
    updateLabel([id], label)
      .catch((e: unknown) => console.error(e))
      .finally(() => setUpdating(false));
  };

  let bg, color, border;
  if (targetSubmission) {
    ({ bg, color, border } = colorMap[targetSubmission.label]);
  }

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
            {labelMenuOptions(type).find(
              (option) => option.value === targetSubmission?.label,
            )?.label || 'Select Option'}
            <ChevronDown className="ml-2 size-3" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          sideOffset={-1}
          className="w-full min-w-[110px] rounded-t-none px-0 pt-1.5"
        >
          {labelMenuOptions(type)
            .filter((option) => !option.hidden)
            .map((option) => (
              <DropdownMenuItem
                key={option.value}
                className="cursor-pointer px-1.5 py-1 text-center text-[0.7rem]"
                onClick={() => selectLabel(option.value, targetSubmission?.id)}
              >
                <StatusPill
                  color={colorsOf(option.value).color}
                  backgroundColor={colorsOf(option.value).bg}
                  borderColor={colorsOf(option.value).border}
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
