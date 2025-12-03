import { Check, ChevronsUpDown } from 'lucide-react';
import React, { type JSX, useMemo } from 'react';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { skillMap } from '@/constants/skillMap';
import { skillSubSkillMap } from '@/interface/skills';
import { cn } from '@/utils/cn';

interface SkillOption {
  value: string;
  label: string;
  color: string;
  isParent?: boolean;
}

interface GroupedSkillOption {
  label: string;
  color: string;
  options: SkillOption[];
}

type SelectOption = SkillOption | GroupedSkillOption;

/**
 * Props for the SkillsCombobox component.
 */
interface SkillsComboboxProps {
  /**
   * The currently selected value. Can be `null` for no selection.
   */
  value?: string | null;

  /**
   * Callback function triggered when the selection changes.
   */
  onChange?: (value: string) => void;

  /**
   * Placeholder text displayed in the combobox.
   * @default 'Select a skill...'
   */
  placeholder?: string;

  /**
   * Whether to include an "All Skills" option in the dropdown.
   * @default false
   */
  all?: boolean;

  /**
   * Additional CSS class names to apply to the root element.
   */
  className?: string;

  /**
   * Whether to show an "unset" option that allows clearing the selection.
   */
  unset?: boolean;

  /**
   * Object containing class names for specific subcomponents.
   */
  classNames?: {
    /**
     * Additional CSS class names for the popover content.
     */
    popoverContent?: string;
  };
}

/**
 * A combobox component for selecting skills, with optional support for all skills
 * and unset options.
 *
 * @param {SkillsComboboxProps} props - The props for the component.
 * @returns {JSX.Element} The rendered combobox component.
 */
export function SkillsCombobox({
  value,
  onChange,
  placeholder = 'Select a skill...',
  all = false,
  unset,
  className,
  classNames,
}: SkillsComboboxProps): JSX.Element {
  const options: SelectOption[] = useMemo(() => {
    const skills: SelectOption[] = [];
    if (all) {
      skills.push({ value: 'All', label: 'All Skills', color: '#64758B' });
    }

    // Add grouped skills with subskills
    Object.entries(skillSubSkillMap).forEach(([parentSkill, subskills]) => {
      const parentColor =
        skillMap.find((s) => s.mainskill === parentSkill)?.color || '#64758B';

      skills.push({
        label: parentSkill,
        color: parentColor,
        options: [
          // Add parent skill as first option
          {
            value: parentSkill,
            label: 'All',
            color: parentColor,
            isParent: true,
          },
          // Then add all subskills
          ...subskills.map((subskill) => ({
            value: subskill.value,
            label: subskill.label,
            color: parentColor,
            isParent: false,
          })),
        ],
      });
    });

    return skills;
  }, [all]);

  const [open, setOpen] = React.useState(false);
  const listRef = React.useRef<HTMLDivElement>(null);

  const isGroupedOption = (
    option: SelectOption,
  ): option is GroupedSkillOption => {
    return 'options' in option && Array.isArray(option.options);
  };

  const findOptionByValue = (value: string): SkillOption | undefined => {
    if (value === 'All') {
      return { value: 'All', label: 'All Skills', color: '#64758B' };
    }

    // Check if value is a parent skill
    const parentSkillEntry = Object.keys(skillSubSkillMap).find(
      (skill) => skill === value,
    );
    if (parentSkillEntry) {
      const parentColor =
        skillMap.find((s) => s.mainskill === parentSkillEntry)?.color ||
        '#64758B';
      return {
        value: parentSkillEntry,
        label: parentSkillEntry,
        color: parentColor,
        isParent: true,
      };
    }

    for (const option of options) {
      if ('options' in option) {
        const foundInGroup = option.options.find((opt) => opt.value === value);
        if (foundInGroup) {
          return foundInGroup;
        }
      } else if (option.value === value) {
        return option;
      }
    }
    return undefined;
  };

  const filteredOptions = React.useMemo(
    () =>
      options.filter((option) => {
        if (isGroupedOption(option)) {
          return Array.isArray(option.options) && option.options.length > 0;
        }
        return true;
      }),
    [options],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'w-32 justify-start px-3 text-xs text-slate-600',
            className,
          )}
        >
          {!!value && (
            <span
              className="mr-2 min-h-3 min-w-3 rounded-full"
              style={{
                backgroundColor: findOptionByValue(value || '')?.color,
              }}
            />
          )}
          <p
            className={cn(
              'truncate',
              findOptionByValue(value || '')?.isParent && 'font-semibold',
            )}
          >
            {value
              ? findOptionByValue(value)?.label || placeholder
              : placeholder}
          </p>
          <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn('w-[200px] p-0', classNames?.popoverContent)}
      >
        <Command>
          <CommandInput
            placeholder="Search..."
            onValueChange={() => {
              setTimeout(() => {
                if (listRef.current) {
                  listRef.current.scrollTop = 0;
                }
              }, 0);
            }}
          />
          <CommandList
            ref={listRef}
            className="scrollbar-visible max-h-[200px] overflow-auto md:max-h-[300px]"
          >
            <CommandEmpty>No skill found.</CommandEmpty>
            <CommandGroup>
              {!!value && unset && (
                <CommandItem
                  value={undefined}
                  onSelect={() => {
                    onChange?.(null!);
                    setOpen(false);
                  }}
                >
                  <p className="text-slate-400">Select a skill</p>
                </CommandItem>
              )}
            </CommandGroup>
            {filteredOptions?.map((option, idx) => {
              if (isGroupedOption(option)) {
                return (
                  <CommandGroup
                    key={`${option.label}-${idx}`}
                    heading={option.label}
                  >
                    {option.options.map((item) => (
                      <CommandItem
                        key={item.value}
                        value={item.value}
                        onSelect={(currentValue) => {
                          onChange?.(currentValue);
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            value === item.value ? 'opacity-100' : 'opacity-0',
                          )}
                        />
                        <span
                          className="mr-2 min-h-3 min-w-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <p>{item.label}</p>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                );
              }

              return (
                <CommandGroup key={option.value}>
                  <CommandItem
                    value={option.value}
                    onSelect={(currentValue) => {
                      onChange?.(currentValue);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === option.value ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    <span
                      className="mr-2 h-3 w-3 rounded-full"
                      style={{ backgroundColor: option.color }}
                    />
                    <p>{option.label}</p>
                  </CommandItem>
                </CommandGroup>
              );
            })}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
