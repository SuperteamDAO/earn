import { Regions } from '@prisma/client';
import { Check, ChevronsUpDown, Earth } from 'lucide-react';
import React, { useMemo } from 'react';

import { UserFlag } from '@/components/shared/UserFlag';
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
import { countries } from '@/constants/country';
import { Superteams } from '@/constants/Superteam';
import { cn } from '@/utils/cn';

interface CountryOption {
  value: string;
  label: string;
  code: string;
}

interface GroupedOption {
  label: string;
  options: CountryOption[];
}

type SelectOption = CountryOption | GroupedOption;

/**
 * Props for the RegionCombobox component.
 */
interface RegionComboboxProps {
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
   * @default 'Select a region...'
   */
  placeholder?: string;

  /**
   * Whether to include a "global" option in the dropdown.
   * @default false
   */
  global?: boolean;

  /**
   * Whether to show superteams grouped options.
   * @default false
   */
  superteams?: boolean;

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
 * A combobox component for selecting regions, with optional support for global, superteam,
 * and unset options.
 *
 * @param {RegionComboboxProps} props - The props for the component.
 * @returns {JSX.Element} The rendered combobox component.
 */
export function RegionCombobox({
  value,
  onChange,
  placeholder = 'Select a region...',
  global = false,
  superteams = false,
  unset,
  className,
  classNames,
}: RegionComboboxProps): JSX.Element {
  const options: SelectOption[] = useMemo(() => {
    const regions: SelectOption[] = [];
    if (global)
      regions.push({ value: Regions.GLOBAL, label: 'Global', code: 'GLOBAL' });
    if (superteams) {
      const superteamCountries = Superteams.flatMap((region) =>
        region.code.toLowerCase(),
      );

      const nonSuperteamCountries = countries.filter(
        (country) => !superteamCountries.includes(country.code.toLowerCase()),
      );
      regions.push({
        label: 'Superteam Regions',
        options: Superteams.map((region) => ({
          value: region.region ?? '-',
          label: region.displayValue,
          code: region.code,
        })),
      });
      regions.push({
        label: 'Other Countries',
        options: nonSuperteamCountries.map((country) => ({
          value: country.name,
          label: country.name,
          code: country.code,
        })),
      });
    } else {
      regions.push({
        label: 'Countries',
        options: countries.map((country) => ({
          value: country.name,
          label: country.name,
          code: country.code,
        })),
      });
    }
    return regions;
  }, []);
  const [open, setOpen] = React.useState(false);

  const isGroupedOption = (option: SelectOption): option is GroupedOption => {
    return 'options' in option && Array.isArray(option.options);
  };

  const findOptionByValue = (value: string): CountryOption | undefined => {
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
            <span className="min-h-4 min-w-4">
              {value === Regions.GLOBAL ? (
                <Earth className="text-slate-500" />
              ) : (
                <UserFlag
                  location={findOptionByValue(value || '')?.code ?? ''}
                  isCode
                />
              )}
            </span>
          )}
          <p className="truncate">
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
          <CommandInput placeholder="Search..." />
          <CommandList className="max-h-[200px] md:max-h-[300px]">
            <CommandEmpty>No region found.</CommandEmpty>
            <CommandGroup>
              {!!value && unset && (
                <CommandItem
                  value={undefined}
                  onSelect={() => {
                    onChange?.(null!);
                    setOpen(false);
                  }}
                >
                  <p className="text-slate-400">Select a region</p>
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
                        <span className="min-h-4 min-w-4">
                          {item.value === Regions.GLOBAL ? (
                            <Earth className="text-slate-500" />
                          ) : (
                            <UserFlag location={item.code} isCode />
                          )}
                        </span>
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
                    {option.value === Regions.GLOBAL ? (
                      <>
                        <Earth className="text-slate-500" />
                        Global
                      </>
                    ) : (
                      <UserFlag location={option.code} isCode />
                    )}
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
