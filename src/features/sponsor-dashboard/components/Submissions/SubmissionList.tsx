import { type SubmissionLabels } from '@prisma/client';
import { useAtom } from 'jotai';
import debounce from 'lodash.debounce';
import { Search } from 'lucide-react';
import React, {
  type Dispatch,
  type SetStateAction,
  useEffect,
  useRef,
} from 'react';

import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { StatusPill } from '@/components/ui/status-pill';
import type { SubmissionWithUser } from '@/interface/submission';
import { cn } from '@/utils/cn';
import { dayjs } from '@/utils/dayjs';
import { getRankLabels } from '@/utils/rank';

import { type Listing } from '@/features/listings/types';
import { EarnAvatar } from '@/features/talent/components/EarnAvatar';

import { selectedSubmissionAtom } from '../../atoms';
import { labelMenuOptions } from '../../constants';
import { colorMap } from '../../utils/statusColorMap';
import { MultiSelectFilter } from './MultiSelectFilter';

interface Props {
  listing?: Listing;
  submissions: SubmissionWithUser[];
  setSearchText: Dispatch<SetStateAction<string>>;
  type?: string;
  selectedFilters: Set<SubmissionLabels | 'Winner' | 'Rejected'>;
  onFilterChange: (
    filters: Set<SubmissionLabels | 'Winner' | 'Rejected'>,
  ) => void;
  toggleSubmission?: (id: string) => void;
  isToggled?: (id: string) => boolean;
  toggleAllSubmissions?: () => void;
  isAllToggled?: boolean;
  isMultiSelectDisabled: boolean;
}

export const SubmissionList = ({
  listing,
  submissions,
  setSearchText,
  type,
  selectedFilters,
  onFilterChange,
  toggleSubmission,
  isToggled,
  toggleAllSubmissions,
  isAllToggled,
  isMultiSelectDisabled,
}: Props) => {
  const [selectedSubmission, setSelectedSubmission] = useAtom(
    selectedSubmissionAtom,
  );

  const debouncedSetSearchText = useRef(debounce(setSearchText, 300)).current;
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      debouncedSetSearchText.cancel();
    };
  }, [debouncedSetSearchText]);

  useEffect(() => {
    if (selectedSubmission?.id && scrollContainerRef.current) {
      const selectedElement = scrollContainerRef.current.querySelector(
        `[data-submission-id="${selectedSubmission.id}"]`,
      );

      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: 'nearest',
        });
      }
    }
  }, [selectedSubmission?.id]);

  const getSubmissionLabel = (submission: SubmissionWithUser) => {
    if (submission?.isWinner && submission?.winnerPosition) {
      if (type === 'project') {
        return 'Winner';
      } else {
        return getRankLabels(submission.winnerPosition);
      }
    } else if (
      submission.status === 'Rejected' &&
      listing?.type === 'project'
    ) {
      return 'Rejected';
    } else if (submission?.label) {
      if (listing?.type === 'bounty' && submission?.label === 'Inaccessible') {
        return 'Inaccessible';
      }
      return labelMenuOptions(listing?.type).find(
        (option) => option.value === submission.label,
      )?.label;
    } else {
      return '';
    }
  };

  const getSubmissionColors = (submission: SubmissionWithUser) => {
    if (submission?.isWinner) {
      return colorMap.Winner;
    } else if (submission.status === 'Rejected') {
      return colorMap.Rejected;
    } else if (submission?.label && colorMap[submission.label]) {
      return colorMap[submission.label];
    } else {
      return {
        bg: 'bg-slate-100',
        color: 'text-slate-600',
        border: 'border-slate-200',
      };
    }
  };

  return (
    <div className="h-full w-full rounded-l-lg border border-slate-200 bg-white">
      <div className="flex w-full items-center justify-between gap-2 p-3">
        {!isMultiSelectDisabled && (
          <Checkbox
            className="data-[state=checked]:border-brand-purple data-[state=checked]:bg-brand-purple"
            checked={isAllToggled}
            disabled={isMultiSelectDisabled}
            onCheckedChange={() =>
              toggleAllSubmissions && toggleAllSubmissions()
            }
          />
        )}

        <div className="relative w-full">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            className="placeholder:text-md focus-visible:ring-brand-purple h-10 border-slate-200 bg-white pl-9 placeholder:font-medium placeholder:text-slate-400"
            onChange={(e) => debouncedSetSearchText(e.target.value)}
            placeholder="Search Submissions"
            type="text"
          />
        </div>
        <MultiSelectFilter
          selectedFilters={selectedFilters}
          onFilterChange={onFilterChange}
          listingType={listing?.type}
        />
      </div>
      <div
        ref={scrollContainerRef}
        className="scrollbar-thin scrollbar-w-1 scrollbar-track-white scrollbar-thumb-slate-200 hover:scrollbar-thumb-slate-300 h-[42rem] w-full overflow-y-auto rounded-bl-lg border-t bg-white"
      >
        {submissions.map((submission) => {
          const { bg, color, border } = getSubmissionColors(submission);
          return (
            <div
              key={submission?.id}
              data-submission-id={submission?.id}
              className={cn(
                'flex cursor-pointer items-center justify-between gap-4 border-b border-slate-200 px-3 py-2',
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
                {!isMultiSelectDisabled && (
                  <Checkbox
                    className="data-[state=checked]:border-brand-purple data-[state=checked]:bg-brand-purple mr-2 disabled:invisible"
                    checked={isToggled && isToggled(submission.id)}
                    disabled={
                      submission?.status !== 'Pending' ||
                      !!submission?.winnerPosition ||
                      isMultiSelectDisabled
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
                  <p className="text-xxs overflow-hidden text-ellipsis whitespace-nowrap text-slate-500">
                    Submitted:{' '}
                    {dayjs(submission?.createdAt).format('MMM D YYYY')}
                  </p>
                </div>
              </div>

              <StatusPill
                className="w-fit px-2 py-0.5 text-[10px]"
                color={color}
                backgroundColor={bg}
                borderColor={border}
              >
                {getSubmissionLabel(submission)}
              </StatusPill>
            </div>
          );
        })}
      </div>
    </div>
  );
};
