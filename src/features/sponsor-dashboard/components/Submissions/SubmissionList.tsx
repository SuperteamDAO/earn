import { type SubmissionLabels } from '@prisma/client';
import { useAtom } from 'jotai';
import debounce from 'lodash.debounce';
import { ChevronDown, Search } from 'lucide-react';
import React, {
  type Dispatch,
  type SetStateAction,
  useEffect,
  useRef,
} from 'react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import type { SubmissionWithUser } from '@/interface/submission';
import { cn } from '@/utils/cn';
import { getRankLabels } from '@/utils/rank';

import { type Listing } from '@/features/listings/types';
import { EarnAvatar } from '@/features/talent/components/EarnAvatar';

import { selectedSubmissionAtom } from '../../atoms';
import { labelMenuOptions } from '../../constants';
import { colorMap } from '../../utils/statusColorMap';

interface Props {
  listing?: Listing;
  submissions: SubmissionWithUser[];
  setSearchText: Dispatch<SetStateAction<string>>;
  type?: string;
  filterLabel: SubmissionLabels | 'Winner' | 'Rejected' | undefined;
  setFilterLabel: Dispatch<
    SetStateAction<SubmissionLabels | 'Winner' | 'Rejected' | undefined>
  >;
  toggleSubmission?: (id: string) => void;
  isToggled?: (id: string) => boolean;
  toggleAllSubmissions?: () => void;
  isAllToggled?: boolean;
}

export const SubmissionList = ({
  listing,
  submissions,
  setSearchText,
  type,
  filterLabel,
  setFilterLabel,
  toggleSubmission,
  isToggled,
  toggleAllSubmissions,
  isAllToggled,
}: Props) => {
  const [selectedSubmission, setSelectedSubmission] = useAtom(
    selectedSubmissionAtom,
  );

  const debouncedSetSearchText = useRef(debounce(setSearchText, 300)).current;

  useEffect(() => {
    return () => {
      debouncedSetSearchText.cancel();
    };
  }, [debouncedSetSearchText]);

  let bg, color;

  if (filterLabel) {
    ({ bg, color } = colorMap[filterLabel]);
  }

  const getSubmissionLabel = (submission: SubmissionWithUser) => {
    if (submission?.isWinner && submission?.winnerPosition) {
      if (type === 'project') {
        return 'Winner';
      } else {
        return getRankLabels(submission.winnerPosition);
      }
    } else if (submission.status === 'Rejected') {
      return 'Rejected';
    } else if (submission?.label) {
      return submission.label;
    } else {
      return '';
    }
  };

  const getSubmissionColors = (submission: SubmissionWithUser) => {
    if (submission?.isWinner) {
      return colorMap.winner;
    } else if (submission.status === 'Rejected') {
      return colorMap.Rejected;
    } else if (submission?.label && colorMap[submission.label]) {
      return colorMap[submission.label];
    } else {
      return {
        bg: 'bg-slate-100',
        color: 'text-slate-600',
      };
    }
  };

  return (
    <div className="h-full w-full rounded-l-xl border border-slate-200 bg-white">
      <div className="flex cursor-pointer flex-col items-center justify-between gap-4 border-b border-slate-200 px-4 py-3">
        <div className="flex w-full items-center justify-between gap-4 py-[3px]">
          {listing?.type === 'project' && (
            <Checkbox
              className="data-[state=checked]:border-brand-purple data-[state=checked]:bg-brand-purple"
              checked={isAllToggled}
              disabled={listing?.isWinnersAnnounced}
              onCheckedChange={() =>
                toggleAllSubmissions && toggleAllSubmissions()
              }
            />
          )}

          <div className="relative w-full">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="placeholder:text-md focus-visible:ring-brand-purple h-12 border-slate-200 bg-white pl-9 placeholder:font-medium placeholder:text-slate-400"
              onChange={(e) => debouncedSetSearchText(e.target.value)}
              placeholder="Search Submissions"
              type="text"
            />
          </div>
        </div>
        <div className="flex w-full cursor-default items-center justify-between">
          <p className="text-xs text-slate-500">Filter By</p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className="hover:border-brand-purple h-auto w-32 border border-slate-300 bg-transparent px-2 py-1 font-medium text-slate-500 capitalize hover:bg-transparent"
                variant="outline"
              >
                <span
                  className={cn(
                    'inline-flex w-full rounded-full px-3 text-center text-[10px] whitespace-nowrap capitalize',
                    bg,
                    color,
                  )}
                >
                  {filterLabel || 'Select Option'}
                </span>
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="min-w-32 border-slate-300">
              <DropdownMenuItem
                className="focus:bg-slate-100"
                onClick={() => setFilterLabel(undefined)}
              >
                <span className="inline-flex rounded-full bg-slate-100 px-3 text-center text-[10px] whitespace-nowrap capitalize">
                  Select Option
                </span>
              </DropdownMenuItem>

              <DropdownMenuItem
                className="focus:bg-slate-100"
                onClick={() => setFilterLabel('Winner')}
              >
                <span
                  className={cn(
                    'inline-flex rounded-full px-3 text-center text-[10px] whitespace-nowrap capitalize',
                    colorMap['Winner'].bg,
                    colorMap['Winner'].color,
                  )}
                >
                  Winner
                </span>
              </DropdownMenuItem>

              {listing?.type === 'project' && (
                <DropdownMenuItem
                  className="focus:bg-slate-100"
                  onClick={() => setFilterLabel('Rejected')}
                >
                  <span
                    className={cn(
                      'inline-flex rounded-full px-3 text-center text-[10px] whitespace-nowrap capitalize',
                      colorMap['Rejected'].bg,
                      colorMap['Rejected'].color,
                    )}
                  >
                    Rejected
                  </span>
                </DropdownMenuItem>
              )}

              {labelMenuOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  className="focus:bg-slate-100"
                  onClick={() =>
                    setFilterLabel(option.value as SubmissionLabels)
                  }
                >
                  <span
                    className={cn(
                      'inline-flex rounded-full px-3 text-center text-[10px] whitespace-nowrap capitalize',
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
        </div>
      </div>
      {submissions.map((submission) => {
        const { bg, color } = getSubmissionColors(submission);
        return (
          <div
            key={submission?.id}
            className={cn(
              'flex cursor-pointer items-center justify-between gap-4 border-b border-slate-200 px-4 py-2',
              'hover:bg-slate-100',
              selectedSubmission?.id === submission?.id
                ? 'bg-slate-100'
                : 'bg-transparent',
            )}
            onClick={() => {
              setSelectedSubmission(submission);
            }}
          >
            <div className="flex items-center">
              {listing?.type === 'project' && (
                <Checkbox
                  className="data-[state=checked]:border-brand-purple data-[state=checked]:bg-brand-purple mr-2"
                  checked={isToggled && isToggled(submission.id)}
                  disabled={
                    listing?.isWinnersAnnounced ||
                    submission?.status !== 'Pending'
                  }
                  onCheckedChange={() =>
                    toggleSubmission && toggleSubmission(submission.id)
                  }
                />
              )}
              <EarnAvatar
                id={submission?.user?.id}
                avatar={submission?.user?.photo || undefined}
              />
              <div className="ml-2 w-40">
                <p className="overflow-hidden text-sm font-medium text-ellipsis whitespace-nowrap text-slate-700">
                  {`${submission?.user?.firstName} ${submission?.user?.lastName}`}
                </p>
                <p className="overflow-hidden text-xs font-medium text-ellipsis whitespace-nowrap text-slate-500">
                  {submission?.user?.email}
                </p>
              </div>
            </div>

            <span
              className={cn(
                'inline-flex rounded-full px-3 py-1 text-center text-[10px] whitespace-nowrap capitalize',
                bg,
                color,
              )}
            >
              {getSubmissionLabel(submission)}
            </span>
          </div>
        );
      })}
    </div>
  );
};
