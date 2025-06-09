import {
  type GrantApplicationStatus,
  type GrantTrancheStatus,
} from '@prisma/client';
import { useAtom } from 'jotai';
import debounce from 'lodash.debounce';
import { Search } from 'lucide-react';
import React, { useEffect, useRef } from 'react';

import { Input } from '@/components/ui/input';
import { cn } from '@/utils/cn';
import { nthLabelGenerator } from '@/utils/rank';

import { EarnAvatar } from '@/features/talent/components/EarnAvatar';

import { selectedGrantTrancheAtom } from '../../atoms';
import { type GrantTrancheWithApplication } from '../../queries/tranches';
import { colorMap } from '../../utils/statusColorMap';
import { MultiSelectFilter } from './MultiSelectFilter';

interface Props {
  tranches: GrantTrancheWithApplication[] | undefined;
  setSearchText: (value: string) => void;
  selectedFilters: Set<GrantTrancheStatus>;
  onFilterChange: (filters: Set<GrantTrancheStatus>) => void;
}

export const TrancheList = ({
  tranches,
  setSearchText,
  selectedFilters,
  onFilterChange,
}: Props) => {
  const debouncedSetSearchText = useRef(debounce(setSearchText, 300)).current;
  const [selectedTranche, setSelectedTranche] = useAtom(
    selectedGrantTrancheAtom,
  );

  useEffect(() => {
    return () => {
      debouncedSetSearchText.cancel();
    };
  }, [debouncedSetSearchText]);

  return (
    <div className="h-full w-full rounded-l-lg border border-slate-200 bg-white">
      <div className="flex w-full items-center justify-between gap-2 p-3">
        <div className="relative w-full">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            className="placeholder:text-md focus-visible:ring-brand-purple h-10 border-slate-200 bg-white pl-9 placeholder:font-medium placeholder:text-slate-400"
            onChange={(e) => debouncedSetSearchText(e.target.value)}
            placeholder="Search Tranche Requests"
            type="text"
          />
        </div>
        <MultiSelectFilter
          selectedFilters={selectedFilters}
          onFilterChange={onFilterChange}
        />
      </div>
      <div className="scrollbar-thin scrollbar-w-1 scrollbar-track-white scrollbar-thumb-slate-200 hover:scrollbar-thumb-slate-300 h-[42rem] w-full overflow-y-auto rounded-bl-lg border-t bg-white">
        {tranches?.map((tranche) => {
          const trancheStatus = tranche?.status;

          const { bg: statusBg, color: statusColor } =
            colorMap[trancheStatus as GrantApplicationStatus];

          return (
            <div
              key={tranche?.id}
              className={cn(
                'flex cursor-pointer items-center justify-between gap-4 border-b border-slate-200 px-3 py-2',
                'hover:bg-slate-100',
                selectedTranche?.id === tranche?.id
                  ? 'bg-[#F5F3FF80]'
                  : 'bg-transparent',
              )}
              onClick={() => {
                setSelectedTranche(tranche);
              }}
            >
              <div className="flex items-center">
                <EarnAvatar
                  id={tranche?.GrantApplication?.user?.id}
                  avatar={tranche?.GrantApplication?.user?.photo || undefined}
                />

                <div className="ml-2 w-40">
                  <p className="overflow-hidden text-sm font-medium text-ellipsis whitespace-nowrap text-slate-700">
                    {tranche?.GrantApplication?.projectTitle}
                  </p>
                  <p className="overflow-hidden text-xs font-medium text-ellipsis whitespace-nowrap text-slate-500">
                    {nthLabelGenerator(tranche?.trancheNumber)} Tranche Request
                  </p>
                </div>
              </div>

              <div className="ml-auto flex w-min flex-col justify-end gap-1 align-bottom">
                <span
                  className={cn(
                    'ml-auto inline-flex w-fit rounded-full px-2 py-0.5 text-center text-[0.625rem] whitespace-nowrap capitalize',
                    statusBg,
                    statusColor,
                  )}
                >
                  {trancheStatus}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
