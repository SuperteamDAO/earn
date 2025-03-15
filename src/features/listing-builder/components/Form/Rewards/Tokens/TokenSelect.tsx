import { Check, ChevronDown } from 'lucide-react';

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
  FormMessage,
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { tokenList } from '@/constants/tokenList';
import { cn } from '@/utils/cn';

import { useListingForm } from '../../../../hooks';
import { TokenLabel } from './TokenLabel';

export function TokenSelect() {
  const form = useListingForm();
  return (
    <FormField
      name="token"
      control={form?.control}
      render={({ field }) => (
        <FormItem className="gap-2">
          <FormLabel>Payment</FormLabel>
          <Popover>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  role="combobox"
                  className={cn(
                    'w-full justify-between',
                    !field.value && 'text-muted-foreground',
                  )}
                >
                  {field.value ? (
                    <TokenLabel
                      showIcon
                      showSymbol
                      classNames={{
                        symbol: 'text-slate-900',
                        postfix: 'text-slate-900',
                      }}
                    />
                  ) : (
                    'Select Token'
                  )}
                  <ChevronDown className="opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-[33rem] p-0">
              <Command>
                <CommandInput placeholder="Search token..." className="h-9" />
                <CommandList>
                  <CommandEmpty>No Token found.</CommandEmpty>
                  <CommandGroup>
                    {tokenList.map((token) => (
                      <CommandItem
                        value={token.tokenName}
                        key={token.tokenSymbol}
                        onSelect={() => {
                          field.onChange(token.tokenSymbol);
                          form.saveDraft();
                        }}
                      >
                        <TokenLabel token={token} showIcon showName />
                        <Check
                          className={cn(
                            'ml-auto',
                            token.tokenSymbol === field.value
                              ? 'opacity-100'
                              : 'opacity-0',
                          )}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          {field.value === 'Any' && (
            <FormDescription>
              Contributors will request an amount in USD, along with their
              preferred token. You are responsible for paying the equivalent
              value in the chosen token.
            </FormDescription>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
