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
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { countries } from '@/constants/country';
import { Superteams } from '@/constants/Superteam';
import { cn } from '@/utils';

import { useListingForm } from '../../../hooks';

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

export function GeoLock() {
  const form = useListingForm();

  const options: SelectOption[] = useMemo(() => {
    const superteamCountries = Superteams.flatMap((region) =>
      region.code.toLowerCase(),
    );

    const nonSuperteamCountries = countries.filter(
      (country) => !superteamCountries.includes(country.code.toLowerCase()),
    );

    return [
      { value: Regions.GLOBAL, label: 'Global', code: 'GLOBAL' },
      {
        label: 'Superteam Regions',
        options: Superteams.map((region) => ({
          value: region.region ?? '-',
          label: region.displayValue,
          code: region.code,
        })),
      },
      {
        label: 'Other Countries',
        options: nonSuperteamCountries.map((country) => ({
          value: country.name,
          label: country.name,
          code: country.code,
        })),
      },
    ];
  }, []);

  return (
    <FormField
      name="region"
      control={form?.control}
      render={({ field }) => {
        return (
          <FormItem className="flex flex-row items-center justify-between gap-4">
            <div className="flex-grow">
              <FormLabel className="">Geo-locking</FormLabel>
              <FormDescription className="flex gap-1">
                {field.value === Regions.GLOBAL ? (
                  'Anyone in the world can participate'
                ) : (
                  <>
                    Participation restricted to{' '}
                    {field.value?.charAt(0).toUpperCase() +
                      field.value?.slice(1).toLowerCase()}
                  </>
                )}
              </FormDescription>
            </div>
            <FormControl className="flex items-center">
              <RegionCombobox
                options={options ?? []}
                value={field.value}
                onChange={(e) => {
                  field.onChange(e);
                  form.saveDraft();
                }}
              />
            </FormControl>
          </FormItem>
        );
      }}
    />
  );
}

interface RegionComboboxProps {
  options: Array<SelectOption>;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}

function RegionCombobox({
  options = [],
  value,
  onChange,
  placeholder = 'Select a region...',
}: RegionComboboxProps) {
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
        // Direct match in flat options
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
          className="w-32 justify-start px-3 text-xs text-slate-600"
        >
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
          <p className="truncate">
            {value
              ? findOptionByValue(value)?.label || placeholder
              : placeholder}
          </p>
          <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search..." />
          <CommandEmpty>No region found.</CommandEmpty>
          <CommandList>
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
                <CommandItem
                  key={option.value}
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
              );
            })}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
