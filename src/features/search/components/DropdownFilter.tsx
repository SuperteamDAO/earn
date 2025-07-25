import { ChevronDown, LucideListFilter, X } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { cn } from '@/utils/cn';

import { CategoryPill } from '@/features/listings/components/CategoryPill';

import {
  type SearchSkills,
  type SearchStatus,
  skillsData,
  statusData,
} from '../constants/schema';

interface DropdownFilterProps {
  activeStatus: SearchStatus[];
  activeSkills: SearchSkills[];
  onStatusToggle: (value: SearchStatus) => void;
  onSkillToggle: (value: SearchSkills) => void;
}

function ActiveStatusPills({
  activeStatus,
  onStatusToggle,
}: {
  activeStatus: SearchStatus[];
  onStatusToggle: (value: SearchStatus) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {statusData
        .filter((f) => activeStatus.includes(f.value))
        .map((filter) => (
          <CategoryPill
            key={filter.value}
            isActive={true}
            onClick={() => onStatusToggle(filter.value)}
          >
            <span className="flex items-center gap-1">
              {filter.label}
              <X className="h-3 w-3" />
            </span>
          </CategoryPill>
        ))}
    </div>
  );
}

function StatusFilterList({
  activeStatus,
  onStatusToggle,
}: {
  activeStatus: SearchStatus[];
  onStatusToggle: (value: SearchStatus) => void;
}) {
  return (
    <>
      {statusData.map((filter) => (
        <DropdownMenuItem
          key={filter.value}
          onSelect={() => onStatusToggle(filter.value)}
          className={cn(
            'mb-1 flex items-center gap-2 text-slate-600 last:mb-0',
            activeStatus.includes(filter.value) && 'bg-slate-100 font-medium',
          )}
        >
          <div
            className={cn(
              'flex size-4 items-center justify-center rounded-full border-[1.5px]',
              filter.circleClasses.border,
            )}
          >
            <div
              className={cn('size-2 rounded-full', filter.circleClasses.bg)}
            />
          </div>
          {filter.label}
        </DropdownMenuItem>
      ))}
    </>
  );
}

function SkillFilterList({
  activeSkills,
  onSkillToggle,
}: {
  activeSkills: SearchSkills[];
  onSkillToggle: (value: SearchSkills) => void;
}) {
  return (
    <>
      {skillsData.map((filter) => (
        <DropdownMenuItem
          key={filter.value}
          onSelect={() => onSkillToggle(filter.value)}
          className={cn(
            'mb-1 flex items-center gap-2 text-slate-600 last:mb-0',
            activeSkills.includes(filter.value) &&
              'bg-slate-100 font-medium text-indigo-600',
          )}
        >
          {filter.label}
        </DropdownMenuItem>
      ))}
    </>
  );
}

export function DropdownFilter({
  activeStatus,
  activeSkills,
  onStatusToggle,
  onSkillToggle,
}: DropdownFilterProps) {
  const isMd = useBreakpoint('md');

  const activeStatusWithLabels = statusData.filter((f) =>
    activeStatus.includes(f.value),
  );
  const activeSkillsWithLabels = skillsData.filter((f) =>
    activeSkills.includes(f.value),
  );

  const hasActiveFilters =
    activeStatusWithLabels.length > 0 || activeSkillsWithLabels.length > 0;

  return (
    <div className="flex items-center gap-2">
      {isMd && activeStatusWithLabels.length > 0 && (
        <ActiveStatusPills
          activeStatus={activeStatus}
          onStatusToggle={onStatusToggle}
        />
      )}

      <DropdownMenu>
        <DropdownMenuTrigger className="focus-visible:outline-none">
          <div
            className={cn(
              'relative flex cursor-pointer items-center gap-1.5 rounded-md p-2 hover:bg-slate-100 sm:p-1.5',
              'text-sm font-normal md:rounded-full md:border md:border-slate-200 md:px-2 md:py-0.5',
              !isMd && hasActiveFilters && 'bg-indigo-50',
            )}
          >
            {isMd ? (
              <>
                <span className="text-sm font-normal text-slate-500">
                  Status
                </span>
                <ChevronDown className="h-4 w-4 text-slate-500" />
              </>
            ) : (
              <LucideListFilter
                className={cn(
                  'h-4 w-4',
                  hasActiveFilters ? 'text-brand-purple' : 'text-slate-500',
                )}
              />
            )}
            {!isMd && hasActiveFilters && (
              <span
                className="bg-brand-purple absolute -top-1 -right-1 block h-2 w-2 rounded-full"
                aria-hidden="true"
              />
            )}
          </div>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="z-[60] w-40">
          <DropdownMenuLabel className="text-sm font-medium text-slate-600 md:hidden">
            Filter by Status
          </DropdownMenuLabel>
          <StatusFilterList
            activeStatus={activeStatus}
            onStatusToggle={onStatusToggle}
          />
          {!isMd && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="font-medium text-slate-600">
                Filter by Skill
              </DropdownMenuLabel>
              <SkillFilterList
                activeSkills={activeSkills}
                onSkillToggle={onSkillToggle}
              />
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
