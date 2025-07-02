import {
  type GrantApplicationStatus,
  type GrantTrancheStatus,
} from '@prisma/client';
import color from '@tiptap/extension-color';
import { bg } from 'date-fns/locale';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { cn } from '@/utils/cn';
import { nthLabelGenerator } from '@/utils/rank';

import { EarnAvatar } from '@/features/talent/components/EarnAvatar';

import { selectedGrantTrancheAtom } from '../../atoms';
import { type GrantTrancheWithApplication } from '../../queries/tranches';
import { colorMap } from '../../utils/statusColorMap';

interface Props {
  tranches: GrantTrancheWithApplication[] | undefined;
  setSearchText: (value: string) => void;
  setFilterLabel: Dispatch<SetStateAction<GrantTrancheStatus | undefined>>;
  filterTriggerLabel: GrantTrancheStatus | undefined;
}

const TrancheStatusFilter: GrantTrancheStatus[] = [
  'Pending',
  'Approved',
  'Rejected',
  'Paid',
];

export const TrancheList = ({
  tranches,
  setSearchText,
  setFilterLabel,
  filterTriggerLabel,
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
    <div className="h-full w-full rounded-l-xl border border-slate-200 bg-white">
      <div className="flex cursor-pointer flex-col items-center justify-between gap-4 border-b border-slate-200 px-4 py-3">
        <div className="flex w-full items-center gap-2">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="placeholder:text-md focus-visible:ring-brand-purple h-10 border-slate-200 bg-white pl-9 placeholder:font-medium placeholder:text-slate-400"
              onChange={(e) => debouncedSetSearchText(e.target.value)}
              placeholder="Search Tranche Requests"
              type="text"
            />
          </div>
        </div>
        <div className="flex w-full cursor-default items-center justify-between">
          <span className="text-xs text-slate-500">Filter By</span>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className="hover:border-brand-purple h-9 w-32 border border-slate-300 bg-transparent px-2 py-1 font-medium text-slate-500 capitalize hover:bg-transparent"
                variant="outline"
              >
                <span
                  className={cn(
                    'inline-flex rounded-full px-3 py-0.5 text-center text-[10px] whitespace-nowrap capitalize',
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
                <span className="inline-flex rounded-full bg-slate-50 px-3 text-center text-[10px] whitespace-nowrap text-slate-500 capitalize">
                  Select Option
                </span>
              </DropdownMenuItem>

              {TrancheStatusFilter.map((status) => (
                <DropdownMenuItem
                  key={status}
                  className="focus:bg-slate-100"
                  onClick={() => setFilterLabel(status)}
                >
                  <span
                    className={cn(
                      'inline-flex rounded-full px-3 text-center text-[10px] whitespace-nowrap capitalize',
                      colorMap[status].bg,
                      colorMap[status].color,
                    )}
                  >
                    {status}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {tranches?.map((tranche) => {
        const trancheStatus = tranche?.status;

        const { bg: statusBg, color: statusColor } =
          colorMap[trancheStatus as GrantApplicationStatus];

        return (
          <div
            key={tranche?.id}
            className={cn(
              'flex cursor-pointer items-center justify-between gap-4 border-b border-slate-200 px-4 py-2',
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
                  'ml-auto inline-flex w-fit rounded-full px-2 py-0.5 text-center text-[9px] whitespace-nowrap capitalize',
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
  );
};
