import {
  type GrantApplicationStatus,
  type SubmissionLabels,
} from '@prisma/client';
import { useAtom } from 'jotai';
import debounce from 'lodash.debounce';
import { Search } from 'lucide-react';
import React, { useEffect, useRef } from 'react';

import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { StatusPill } from '@/components/ui/status-pill';
import { Tooltip } from '@/components/ui/tooltip';
import { Superteams } from '@/constants/Superteam';
import { cn } from '@/utils/cn';

import { EarnAvatar } from '@/features/talent/components/EarnAvatar';

import { selectedGrantApplicationAtom } from '../../atoms';
import { labelMenuOptionsGrants } from '../../constants';
import { type GrantApplicationWithUser } from '../../types';
import { colorMap } from '../../utils/statusColorMap';
import { MultiSelectFilter } from './MultiSelectFilter';

interface Props {
  applications: GrantApplicationWithUser[] | undefined;
  setSearchText: (value: string) => void;
  toggleApplication: (id: string) => void;
  isToggled: (id: string) => boolean;
  toggleAllApplications: () => void;
  isAllToggled: boolean;
  selectedFilters: Set<GrantApplicationStatus | SubmissionLabels>;
  onFilterChange: (
    filters: Set<GrantApplicationStatus | SubmissionLabels>,
  ) => void;
  isToggleDisabled: boolean;
}

export const ApplicationList = ({
  applications,
  setSearchText,
  toggleApplication,
  isToggled,
  toggleAllApplications,
  isAllToggled,
  selectedFilters,
  onFilterChange,
  isToggleDisabled,
}: Props) => {
  const debouncedSetSearchText = useRef(debounce(setSearchText, 300)).current;
  const [selectedApplication, setSelectedApplication] = useAtom(
    selectedGrantApplicationAtom,
  );

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      debouncedSetSearchText.cancel();
    };
  }, [debouncedSetSearchText]);

  useEffect(() => {
    if (selectedApplication?.id && scrollContainerRef.current) {
      const selectedElement = scrollContainerRef.current.querySelector(
        `[data-application-id="${selectedApplication.id}"]`,
      );

      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: 'nearest',
        });
      }
    }
  }, [selectedApplication?.id]);

  return (
    <div className="h-full w-full rounded-l-lg border border-slate-200 bg-white">
      <div className="flex w-full items-center justify-between gap-2 p-3">
        <Checkbox
          checked={!isToggleDisabled ? isAllToggled : false}
          disabled={isToggleDisabled}
          onCheckedChange={() => toggleAllApplications()}
          className="data-[state=checked]:border-brand-purple data-[state=checked]:bg-brand-purple"
        />
        <div className="relative w-full">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            className="placeholder:text-md focus-visible:ring-brand-purple h-10 border-slate-200 bg-white pl-9 placeholder:font-medium placeholder:text-slate-400"
            onChange={(e) => debouncedSetSearchText(e.target.value)}
            placeholder="Search Applications"
            type="text"
          />
        </div>
        <MultiSelectFilter
          selectedFilters={selectedFilters}
          onFilterChange={onFilterChange}
        />
      </div>
      <div
        ref={scrollContainerRef}
        className="scrollbar-thin scrollbar-w-1 scrollbar-track-white scrollbar-thumb-slate-200 hover:scrollbar-thumb-slate-300 h-[42rem] w-full overflow-y-auto rounded-bl-lg border-t bg-white"
      >
        {applications?.map((application) => {
          const applicationStatus = application?.applicationStatus;

          const applicationLabel = application?.label;
          const applicationLabelUi = labelMenuOptionsGrants.find(
            (s) => s.value === application?.label,
          )?.label;
          const {
            bg: statusBg,
            color: statusColor,
            border: statusBorder,
          } = colorMap[applicationStatus as GrantApplicationStatus];
          const {
            bg: labelBg,
            color: labelColor,
            border: labelBorder,
          } = colorMap[applicationLabel];
          const isSuperteamMember =
            application?.user.superteamLevel?.includes('Superteam') || false;
          const superteam = isSuperteamMember
            ? Superteams.find(
                (s) => s.name === application?.user.superteamLevel,
              )
            : undefined;
          return (
            <div
              key={application?.id}
              data-application-id={application?.id}
              className={cn(
                'flex cursor-pointer items-center justify-between gap-4 border-b border-slate-200 px-3 py-2',
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
                  className="data-[state=checked]:border-brand-purple data-[state=checked]:bg-brand-purple mr-2 disabled:invisible"
                  checked={isToggled(application.id)}
                  disabled={application?.applicationStatus !== 'Pending'}
                  onCheckedChange={() => toggleApplication(application.id)}
                />

                <EarnAvatar
                  id={application?.user?.id}
                  avatar={application?.user?.photo || undefined}
                />

                <div className="ml-2 w-40">
                  <p className="overflow-hidden text-sm font-medium text-ellipsis whitespace-nowrap text-slate-700">
                    {application?.projectTitle}
                  </p>
                  <span className="flex items-center gap-2">
                    <p className="overflow-hidden text-xs font-medium text-ellipsis whitespace-nowrap text-slate-500">
                      {`${application?.user?.firstName} ${application?.user?.lastName}`}
                    </p>
                    {superteam && (
                      <Tooltip
                        content={application?.user?.superteamLevel + ' Member'}
                      >
                        <img
                          src={superteam.icons}
                          alt="Superteam Member"
                          className="size-3 rounded-full"
                        />
                      </Tooltip>
                    )}
                  </span>
                </div>
              </div>

              <div className="ml-auto flex w-min flex-col justify-end gap-1 align-bottom">
                {applicationLabel === 'Spam' ? (
                  <StatusPill
                    className="ml-auto w-fit text-[0.625rem]"
                    color={labelColor}
                    backgroundColor={labelBg}
                    borderColor={labelBorder}
                  >
                    {applicationLabelUi || applicationLabel}
                  </StatusPill>
                ) : applicationStatus !== 'Pending' ||
                  applicationLabel === 'Unreviewed' ? (
                  <StatusPill
                    className="ml-auto w-fit text-[0.625rem]"
                    color={statusColor}
                    backgroundColor={statusBg}
                    borderColor={statusBorder}
                  >
                    {applicationStatus}
                  </StatusPill>
                ) : (
                  <StatusPill
                    className="ml-auto w-fit text-[0.625rem]"
                    color={labelColor}
                    backgroundColor={labelBg}
                    borderColor={labelBorder}
                  >
                    {applicationLabelUi || applicationLabel}
                  </StatusPill>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
