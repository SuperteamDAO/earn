import { Check, ChevronDown, CopyIcon } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { CopyButton } from '@/components/ui/copy-tooltip';
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
import { useTokenList } from '@/constants/tokenList';
import {
  IN_KIND_REWARD_LABEL,
  IN_KIND_REWARD_OPTION_LABEL,
  IN_KIND_REWARD_SYMBOL,
  isInKindReward,
} from '@/lib/rewards/inKind';
import { cn } from '@/utils/cn';

import { useListingForm } from '../../../../hooks';
import { TokenLabel } from './TokenLabel';

export function TokenSelect() {
  const form = useListingForm();
  const tokens = useTokenList();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const showStandaloneInKindOption = search.trim().length === 0;

  return (
    <FormField
      name="token"
      control={form?.control}
      render={({ field }) => {
        const handleTokenSelect = (tokenSymbol: string) => {
          field.onChange(tokenSymbol);
          if (isInKindReward(tokenSymbol)) {
            form.setValue('isFndnPaying', false, { shouldValidate: true });
          }
          setIsOpen(false);
          form.saveDraft();
        };

        return (
          <FormItem className="gap-2">
            <FormLabel>Payment</FormLabel>
            <Popover
              open={isOpen}
              onOpenChange={(nextOpen) => {
                setIsOpen(nextOpen);
                if (!nextOpen) {
                  setSearch('');
                }
              }}
            >
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
                  <CommandInput
                    value={search}
                    onValueChange={setSearch}
                    placeholder="Search token..."
                    className="h-9"
                  />
                  <CommandList>
                    <CommandEmpty className="flex flex-col gap-2 py-8 text-center">
                      <p>{`Don't see your token?`}</p>
                      <p className="mx-auto w-1/2 sm:text-[0.6875rem]">
                        {`Send us your token's`}{' '}
                        <a
                          target="_blank"
                          href="https://coinmarketcap.com/"
                          className="text-blue-700 hover:underline"
                        >
                          CoinMarketCap
                        </a>{' '}
                        link at
                        <CopyButton
                          text="support@superteam.fun"
                          contentProps={{
                            side: 'left',
                            className: 'text-[0.6875rem] px-2 py-0.5',
                          }}
                          content="Click to copy"
                        >
                          <Badge
                            variant="secondary"
                            className="border-border mx-1 my-0.5 inline-flex cursor-pointer items-center gap-1 px-1 text-slate-500 sm:text-[11px]"
                          >
                            support@superteam.fun
                            <CopyIcon className="h-3 w-3" />
                          </Badge>
                        </CopyButton>
                        to get it added.
                      </p>
                    </CommandEmpty>
                    <CommandGroup>
                      {tokens.map((token) => (
                        <CommandItem
                          value={token.tokenName}
                          key={token.tokenSymbol}
                          onSelect={() => handleTokenSelect(token.tokenSymbol)}
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
                    {showStandaloneInKindOption ? (
                      <>
                        <div className="px-1">
                          <CommandSeparator className="bg-slate-200" />
                        </div>
                        <CommandGroup>
                          <CommandItem
                            value={IN_KIND_REWARD_OPTION_LABEL}
                            keywords={[
                              'in-kind',
                              'in kind',
                              'credits',
                              'rewards',
                            ]}
                            onSelect={() =>
                              handleTokenSelect(IN_KIND_REWARD_SYMBOL)
                            }
                          >
                            <span className="text-sm font-medium text-slate-600">
                              {IN_KIND_REWARD_OPTION_LABEL}
                            </span>
                            <Check
                              className={cn(
                                'ml-auto',
                                field.value === IN_KIND_REWARD_SYMBOL
                                  ? 'opacity-100'
                                  : 'opacity-0',
                              )}
                            />
                          </CommandItem>
                        </CommandGroup>
                      </>
                    ) : (
                      <CommandGroup>
                        <CommandItem
                          value={IN_KIND_REWARD_OPTION_LABEL}
                          keywords={[
                            'in-kind',
                            'in kind',
                            'credits',
                            'rewards',
                          ]}
                          onSelect={() =>
                            handleTokenSelect(IN_KIND_REWARD_SYMBOL)
                          }
                        >
                          <span className="text-sm font-medium text-slate-600">
                            {IN_KIND_REWARD_LABEL}
                          </span>
                          <Check
                            className={cn(
                              'ml-auto',
                              field.value === IN_KIND_REWARD_SYMBOL
                                ? 'opacity-100'
                                : 'opacity-0',
                            )}
                          />
                        </CommandItem>
                      </CommandGroup>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
