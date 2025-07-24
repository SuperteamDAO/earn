import { ChevronDown, LucideListFilter, X } from 'lucide-react';
import posthog from 'posthog-js';

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

import type { CheckboxFilter } from '../types';

interface DropdownFilterProps {
  statusFilters: CheckboxFilter[];
  skillsFilters: CheckboxFilter[];
  onStatusChange: (value: string) => void;
  onSkillChange: (value: string) => void;
  loading?: boolean;
}

export function DropdownFilter({
  statusFilters,
  skillsFilters,
  onStatusChange,
  onSkillChange,
  loading,
}: DropdownFilterProps) {
  const isMd = useBreakpoint('md');

  const activeStatusFilters = statusFilters.filter((f) => f.checked);
  const activeSkillsFilters = skillsFilters.filter((f) => f.checked);
  const hasActiveFilters =
    activeStatusFilters.length > 0 || activeSkillsFilters.length > 0;

  const handleStatusRemove = (value: string) => {
    onStatusChange(value);
    posthog.capture('remove_status_filter', { filter: value });
  };

  return (
    <div className="flex items-center gap-2">
      {isMd && activeStatusFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeStatusFilters.map((filter) => (
            <CategoryPill
              key={filter.value}
              isActive={true}
              onClick={() => handleStatusRemove(filter.value)}
            >
              <span className="flex items-center gap-1">
                {filter.label}
                <X className="h-3 w-3" />
              </span>
            </CategoryPill>
          ))}
        </div>
      )}

      <DropdownMenu
        onOpenChange={(open) => {
          if (open) {
            posthog.capture('open_search_filters');
          }
        }}
      >
        <DropdownMenuTrigger
          disabled={loading}
          className="focus-visible:outline-none"
        >
          <div
            className={cn(
              'relative flex cursor-pointer items-center gap-1.5 rounded-md p-2 hover:bg-slate-100 sm:p-1.5',
              'text-sm font-normal md:rounded-full md:border md:border-slate-200 md:px-2 md:py-0.5',
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

        <DropdownMenuContent align="end" className="z-[60] w-56">
          {/* Status Filters */}
          <DropdownMenuLabel className="font-medium text-slate-600">
            Filter by Status
          </DropdownMenuLabel>
          {statusFilters.map((filter) => (
            <DropdownMenuItem
              key={filter.value}
              onSelect={() => onStatusChange(filter.value)}
              className={cn(
                'flex items-center gap-2 text-slate-600',
                filter.checked && 'bg-slate-100 font-medium',
              )}
            >
              <div
                className={cn(
                  'flex h-4 w-4 items-center justify-center rounded-full border-[1.5px]',
                  filter.checked ? 'border-brand-purple' : 'border-slate-300',
                )}
              >
                {filter.checked && (
                  <div className="bg-brand-purple h-2 w-2 rounded-full" />
                )}
              </div>
              {filter.label}
            </DropdownMenuItem>
          ))}

          {/* Skills Filters - Mobile Only */}
          {!isMd && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="font-medium text-slate-600">
                Filter by Skill
              </DropdownMenuLabel>
              {skillsFilters.map((filter) => (
                <DropdownMenuItem
                  key={filter.value}
                  onSelect={() => onSkillChange(filter.value)}
                  className={cn(
                    'flex items-center gap-2 text-slate-600',
                    filter.checked && 'bg-slate-100 font-medium',
                  )}
                >
                  <div
                    className={cn(
                      'flex h-4 w-4 items-center justify-center rounded-full border-[1.5px]',
                      filter.checked
                        ? 'border-brand-purple'
                        : 'border-slate-300',
                    )}
                  >
                    {filter.checked && (
                      <div className="bg-brand-purple h-2 w-2 rounded-full" />
                    )}
                  </div>
                  {filter.label}
                </DropdownMenuItem>
              ))}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
