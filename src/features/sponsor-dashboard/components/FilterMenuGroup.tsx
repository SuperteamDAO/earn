import { DropdownMenuGroup } from '@/components/ui/dropdown-menu';
import { StatusPill } from '@/components/ui/status-pill';
import { Switch } from '@/components/ui/switch';

import { colorMap } from '../utils/statusColorMap';

interface FilterMenuGroupProps<T extends string> {
  title: string;
  listClassName: string;
  filters: Array<{ label: string; value: T }>;
  selectedFilters: ReadonlySet<T>;
  onToggle: (value: T) => void;
}

const getFilterColor = (value: string) => {
  return (
    colorMap[value as keyof typeof colorMap] || {
      bg: 'bg-slate-100',
      color: 'text-slate-600',
      border: 'border-slate-200',
    }
  );
};

export const FilterMenuGroup = <T extends string>({
  title,
  listClassName,
  filters,
  selectedFilters,
  onToggle,
}: FilterMenuGroupProps<T>) => (
  <DropdownMenuGroup>
    <div className="px-3 py-1 text-xs text-slate-400">{title}</div>
    <div className={listClassName}>
      {filters.map((filter) => {
        const isSelected = selectedFilters.has(filter.value);
        const colors = getFilterColor(filter.value);

        return (
          <label
            key={filter.value}
            className="flex cursor-pointer items-center justify-between rounded-md px-3 py-1 hover:bg-slate-100"
          >
            <div className="flex items-center space-x-2">
              <Switch
                checked={isSelected}
                onCheckedChange={() => onToggle(filter.value)}
                className="data-[state=checked]:bg-brand-purple h-3 w-5.5"
                thumbClassName="size-2 data-[state=checked]:translate-x-2.5"
              />
              <StatusPill
                className="text-[0.625rem]"
                color={colors.color}
                backgroundColor={colors.bg}
                borderColor={colors.border}
              >
                {filter.label}
              </StatusPill>
            </div>
          </label>
        );
      })}
    </div>
  </DropdownMenuGroup>
);
