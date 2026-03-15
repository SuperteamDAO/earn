'use client';

import { ChevronsUpDown } from 'lucide-react';
import { type ReactNode, useEffect, useState } from 'react';

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useDebounce } from '@/components/ui/multi-select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/utils/cn';

interface AsyncComboboxOption {
  label: string;
  value: string;
}

interface AsyncComboboxProps<TOption extends AsyncComboboxOption> {
  value: TOption | null;
  onChange: (option: TOption) => void | Promise<void>;
  loadOptions: (query: string) => Promise<TOption[]>;
  placeholder: string;
  emptyMessage?: string;
  searchPlaceholder?: string;
  renderOption: (option: TOption) => ReactNode;
  renderValue?: (option: TOption) => ReactNode;
  isExpanded?: boolean;
  className?: string;
}

export function AsyncCombobox<TOption extends AsyncComboboxOption>({
  value,
  onChange,
  loadOptions,
  placeholder,
  emptyMessage = 'No results found.',
  searchPlaceholder = 'Search...',
  renderOption,
  renderValue,
  isExpanded = true,
  className,
}: AsyncComboboxProps<TOption>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<TOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 250);

  useEffect(() => {
    if (!open) {
      return;
    }

    let isCancelled = false;

    const fetchOptions = async () => {
      setIsLoading(true);

      try {
        const nextOptions = await loadOptions(debouncedQuery);
        if (!isCancelled) {
          setOptions(nextOptions);
        }
      } catch {
        if (!isCancelled) {
          setOptions([]);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void fetchOptions();

    return () => {
      isCancelled = true;
    };
  }, [debouncedQuery, loadOptions, open]);

  useEffect(() => {
    if (!open) {
      setQuery('');
    }
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'flex min-h-[46px] w-full items-center rounded-md border border-slate-300 bg-white px-3 text-left text-sm shadow-xs transition-colors hover:border-indigo-500 focus-visible:border-indigo-500 focus-visible:ring-1 focus-visible:ring-indigo-500 focus-visible:outline-hidden',
            className,
          )}
        >
          <div className="min-w-0 flex-1">
            {value ? (
              renderValue ? (
                renderValue(value)
              ) : (
                <span className="truncate">{value.label}</span>
              )
            ) : (
              <span className="text-slate-400">{placeholder}</span>
            )}
          </div>
          {isExpanded && (
            <ChevronsUpDown className="ml-2 size-4 shrink-0 text-slate-400" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[--radix-popover-trigger-width] p-0"
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={query}
            onValueChange={setQuery}
          />
          <CommandList className="scrollbar-visible max-h-[300px] overflow-auto">
            {isLoading ? (
              <div className="py-6 text-center text-sm text-slate-400">
                Loading...
              </div>
            ) : options.length === 0 ? (
              <CommandEmpty>{emptyMessage}</CommandEmpty>
            ) : (
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={`${option.label} ${option.value}`}
                    onSelect={() => {
                      void onChange(option);
                      setOpen(false);
                    }}
                  >
                    {renderOption(option)}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
