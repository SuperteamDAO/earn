import {
  type GrantApplicationStatus,
  type SubmissionLabels,
} from '@prisma/client';
import { useAtom } from 'jotai';
import debounce from 'lodash.debounce';
import { ChevronDown, Search } from 'lucide-react';
import React, {
  type Dispatch,
  type SetStateAction,
  useEffect,
  useMemo,
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
import { cn } from '@/utils/cn';

import { EarnAvatar } from '@/features/talent/components/EarnAvatar';

import { selectedGrantApplicationAtom } from '../../atoms';
import { labelMenuOptions } from '../../constants';
import { type GrantApplicationWithUser } from '../../types';
import { colorMap } from '../../utils/statusColorMap';

interface Props {
  applications: GrantApplicationWithUser[] | undefined;
  setSearchText: (value: string) => void;
  toggleApplication: (id: string) => void;
  isToggled: (id: string) => boolean;
  toggleAllApplications: () => void;
  isAllToggled: boolean;
  filterLabel: SubmissionLabels | GrantApplicationStatus | undefined;
  isToggleDisabled: boolean;
  setFilterLabel: Dispatch<
    SetStateAction<SubmissionLabels | GrantApplicationStatus | undefined>
  >;
}

const ApplicationStatusFilter: GrantApplicationStatus[] = [
  'Pending',
  'Approved',
  'Completed',
  'Rejected',
];

export const ApplicationList = ({
  applications,
  setSearchText,
  toggleApplication,
  isToggled,
  toggleAllApplications,
  isAllToggled,
  filterLabel,
  setFilterLabel,
  isToggleDisabled,
}: Props) => {
  const debouncedSetSearchText = useRef(debounce(setSearchText, 300)).current;
  const [selectedApplication, setSelectedApplication] = useAtom(
    selectedGrantApplicationAtom,
  );

  useEffect(() => {
    return () => {
      debouncedSetSearchText.cancel();
    };
  }, [debouncedSetSearchText]);

  let bg, color;

  if (filterLabel) {
    ({ bg, color } = colorMap[filterLabel]);
  }

  const applicationLabels = useMemo(
    () => [
      ...labelMenuOptions.filter(
        (s) => !['Spam', 'Unreviewed'].includes(s.value),
      ),
      {
        label: 'Low Quality',
        value: 'Low_Quality',
      },
    ],
    [],
  );

  const filterTriggerLabel = useMemo(() => {
    const applicationLabel = applicationLabels.find(
      (s) => s.value === filterLabel,
    );
    if (applicationLabel) return applicationLabel.label;
    else return filterLabel;
  }, [filterLabel]);

  return (
    <div className="h-full w-full rounded-l-xl border border-slate-200 bg-white">
      <div className="flex cursor-pointer flex-col items-center justify-between gap-4 border-b border-slate-200 px-4 py-3">
        <div className="flex w-full items-center gap-2">
          <Checkbox
            checked={!isToggleDisabled ? isAllToggled : false}
            disabled={isToggleDisabled}
            onCheckedChange={() => toggleAllApplications()}
            className="data-[state=checked]:border-brand-purple data-[state=checked]:bg-brand-purple"
          />
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="placeholder:text-md h-10 border-slate-200 bg-white pl-9 placeholder:font-medium placeholder:text-slate-400 focus-visible:ring-brand-purple"
              onChange={(e) => debouncedSetSearchText(e.target.value)}
              placeholder="Search Applications"
              type="text"
            />
          </div>
        </div>
        <div className="flex w-full cursor-default items-center justify-between">
          <span className="text-xs text-slate-500">Filter By</span>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className="h-9 w-32 border border-slate-300 bg-transparent px-2 py-1 font-medium capitalize text-slate-500 hover:border-brand-purple hover:bg-transparent"
                variant="outline"
              >
                <span
                  className={cn(
                    'inline-flex whitespace-nowrap rounded-full px-3 py-0.5 text-center text-[10px] capitalize',
                    bg,
                    color,
                  )}
                >
                  {filterTriggerLabel || 'Select Option'}
                </span>
                <ChevronDown className="ml-1 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="min-w-32 border-slate-300">
              <DropdownMenuItem
                className="focus:bg-slate-100"
                onClick={() => setFilterLabel(undefined)}
              >
                <span className="inline-flex whitespace-nowrap rounded-full bg-slate-100 px-3 text-center text-[10px] capitalize">
                  Select Option
                </span>
              </DropdownMenuItem>

              {ApplicationStatusFilter.map((status) => (
                <DropdownMenuItem
                  key={status}
                  className="focus:bg-slate-100"
                  onClick={() => setFilterLabel(status)}
                >
                  <span
                    className={cn(
                      'inline-flex whitespace-nowrap rounded-full px-3 text-center text-[10px] capitalize',
                      colorMap[status].bg,
                      colorMap[status].color,
                    )}
                  >
                    {status}
                  </span>
                </DropdownMenuItem>
              ))}
              {applicationLabels.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  className="focus:bg-slate-100"
                  onClick={() =>
                    setFilterLabel(option.value as SubmissionLabels)
                  }
                >
                  <span
                    className={cn(
                      'inline-flex whitespace-nowrap rounded-full px-3 text-center text-[10px] capitalize',
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
      {applications?.map((application) => {
        const applicationStatus = application?.applicationStatus;

        const applicationLabel = application?.label;
        const applicationLabelUi = applicationLabels.find(
          (s) => s.value === application?.label,
        )?.label;
        const { bg: statusBg, color: statusColor } =
          colorMap[applicationStatus as GrantApplicationStatus];
        const { bg: labelBg, color: labelColor } = colorMap[applicationLabel];
        return (
          <div
            key={application?.id}
            className={cn(
              'flex cursor-pointer items-center justify-between gap-4 border-b border-slate-200 px-4 py-2',
              'hover:bg-slate-100',
              selectedApplication?.id === application?.id
                ? 'bg-[#F5F3FF80]'
                : 'bg-transparent',
            )}
            onClick={() => {
              setSelectedApplication(application);
            }}
          >
            <div className="flex items-center">
              <Checkbox
                className="mr-2 data-[state=checked]:border-brand-purple data-[state=checked]:bg-brand-purple"
                checked={isToggled(application.id)}
                disabled={application?.applicationStatus !== 'Pending'}
                onCheckedChange={() => toggleApplication(application.id)}
              />

              <EarnAvatar
                id={application?.user?.id}
                avatar={application?.user?.photo || undefined}
              />

              <div className="ml-2 w-40">
                <p className="overflow-hidden text-ellipsis whitespace-nowrap text-sm font-medium text-slate-700">
                  {application?.projectTitle}
                </p>
                <p className="overflow-hidden text-ellipsis whitespace-nowrap text-xs font-medium text-slate-500">
                  {`${application?.user?.firstName} ${application?.user?.lastName}`}
                </p>
              </div>
            </div>

            <div className="ml-auto flex w-min flex-col justify-end gap-1 align-bottom">
              <span
                className={cn(
                  'ml-auto inline-flex w-fit whitespace-nowrap rounded-full px-2 py-0.5 text-center text-[9px] capitalize',
                  statusBg,
                  statusColor,
                )}
              >
                {applicationStatus}
              </span>
              <span
                className={cn(
                  'ml-auto inline-flex w-fit whitespace-nowrap rounded-full px-2 py-0.5 text-center text-[9px] capitalize',
                  labelBg,
                  labelColor,
                )}
              >
                {applicationLabelUi || applicationLabel}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
