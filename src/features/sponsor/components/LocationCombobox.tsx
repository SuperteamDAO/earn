'use client';

// Earn's RegionCombobox without its Superteam chapters (which it fetched
// with react-query): the sponsor forms only pick a country.
import { Check, ChevronsUpDown, Earth } from 'lucide-react';
import React, { type JSX, useMemo } from 'react';

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
import { countries, SANCTIONED_COUNTRY_CODES } from '@/constants/country';
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
interface LocationComboboxProps {
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
   * Additional CSS class names to apply to the root element.
   */
  className?: string;

  /**
   * Whether to show identified regions in the list or not.
   * @default false
   */
  regions?: boolean;

  /**
   * Whether the combobox should be disabled.
   * @default false
   */
  disabled?: boolean;

  /**
   * Whether to hide sanctioned countries from the list.
   * @default false
   */
  excludeSanctioned?: boolean;

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

const isGroupedOption = (option: SelectOption): option is GroupedOption => {
  return 'options' in option && Array.isArray(option.options);
};

/**
 * A combobox component for selecting regions, with an optional global option.
 *
 * @param {LocationComboboxProps} props - The props for the component.
 * @returns {JSX.Element} The rendered combobox component.
 */
export function LocationCombobox({
  value,
  onChange,
  placeholder = 'Select a region...',
  global = false,
  regions: allowRegions = false,
  disabled = false,
  excludeSanctioned = false,
  className,
  classNames,
}: LocationComboboxProps): JSX.Element {
  const options: SelectOption[] = useMemo(() => {
    const isoCountries = countries.filter(
      (c) =>
        c.iso &&
        !(excludeSanctioned && SANCTIONED_COUNTRY_CODES.includes(c.code)),
    );
    const regions: SelectOption[] = [];
    if (global)
      regions.push({ value: 'Global', label: 'Global', code: 'Global' });
    regions.push({
      label: 'Countries',
      options: isoCountries.map((country) => ({
        value: country.name,
        label: country.name,
        code: country.code,
      })),
    });
    if (allowRegions) {
      regions.push({
        label: 'Regions',
        options: countries
          .filter((s) => s.region)
          .map((country) => ({
            value: country.name,
            label: country.displayValue || country.name,
            code: country.code,
          })),
      });
    }
    return regions;
  }, [global, allowRegions, excludeSanctioned]);
  const [open, setOpen] = React.useState(false);
  const listRef = React.useRef<HTMLDivElement>(null);

  const findOptionByValue = (target: string): CountryOption | undefined => {
    for (const option of options) {
      if ('options' in option) {
        const foundInGroup = option.options.find((opt) => opt.value === target);
        if (foundInGroup) {
          return foundInGroup;
        }
      } else if (option.value === target) {
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
  const selectedOption = value ? findOptionByValue(value) : undefined;

  return (
    <Popover
      open={disabled ? false : open}
      onOpenChange={(nextOpen) => {
        if (disabled) {
          setOpen(false);
          return;
        }
        setOpen(nextOpen);
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          disabled={disabled}
          aria-expanded={open}
          className={cn(
            'w-32 justify-start px-3 text-xs text-slate-600',
            disabled && 'cursor-not-allowed',
            className,
          )}
        >
          {!!value && (
            <span className="min-h-4 min-w-4">
              {value === 'Global' ? (
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
            {value ? selectedOption?.label || value : placeholder}
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
            <CommandEmpty>No region found.</CommandEmpty>
            <CommandGroup />
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
                          {item.value === 'Global' ? (
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
                    {option.value === 'Global' ? (
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
