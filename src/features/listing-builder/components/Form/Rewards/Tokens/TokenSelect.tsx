import { Check, ChevronDown, CopyIcon } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
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
import { useClipboard } from '@/hooks/use-clipboard';
import { cn } from '@/utils/cn';

import { useListingForm } from '../../../../hooks';
import { TokenLabel } from './TokenLabel';

export function TokenSelect() {
  const form = useListingForm();
  const clipboard = useClipboard('support@superteamearn.com');
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
                    <span>Select Token</span>
                  )}
                  <ChevronDown className="opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-[33rem] p-0">
              <Command>
                <CommandInput placeholder="Search token..." className="h-9" />
                <CommandList>
                  <CommandEmpty className="flex flex-col gap-2 py-8 text-center">
                    <p>{`Don't see your token?`}</p>
                    <p className="mx-auto w-1/2 sm:text-[11px]">
                      {`Send us your token's`}{' '}
                      <a
                        target="_blank"
                        href="https://coinmarketcap.com/"
                        className="text-blue-700 hover:underline"
                      >
                        CoinMarketCap
                      </a>{' '}
                      link at
                      <Badge
                        variant="secondary"
                        className="border-border mx-1 my-0.5 inline-flex cursor-pointer items-center gap-1 px-1 text-slate-500 sm:text-[11px]"
                        onClick={() => {
                          clipboard.onCopy();
                          toast.success('Email Address copied to clipboard!');
                        }}
                      >
                        support@superteamearn.com
                        <CopyIcon className="h-3 w-3" />
                      </Badge>
                      to get it added.
                    </p>
                  </CommandEmpty>
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
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
