import { Check, ChevronDown, CopyIcon, Loader2, Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
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
import {
  addTokenToList,
  type Token,
  useTokenList,
} from '@/constants/tokenList';
import { cn } from '@/utils/cn';
import {
  getTokenSearchRank,
  normalizeTokenSearchValue,
  sortJupiterTokenSearchResults,
  sortTokenSearchResults,
} from '@/utils/tokenSearch';
import { truncatePublicKey } from '@/utils/truncatePublicKey';

import { useListingForm } from '../../../../hooks';
import { TokenLabel } from './TokenLabel';

interface JupiterToken {
  id: string;
  name: string;
  symbol: string;
  icon?: string | null;
  decimals: number;
  isVerified: boolean;
}

type TokenSearchResponse = {
  jupiterTokens?: JupiterToken[];
};

type AddTokenResponse = {
  token?: Token;
  error?: string;
};

const supportEmail = 'support@superteam.fun';
const defaultTokenIcon = '/assets/dollar.svg';

const getTokenIconSrc = (icon?: string | null) => {
  const value = icon?.trim();
  if (!value) return defaultTokenIcon;

  if (value.startsWith('/cdn/ipfs-io/')) {
    return `/api/token-icon?url=${encodeURIComponent(
      `https://ipfs.io/${value.slice('/cdn/ipfs-io/'.length)}`,
    )}`;
  }

  if (value.startsWith('/cdn/arweave/')) {
    return `/api/token-icon?url=${encodeURIComponent(
      `https://arweave.net/${value.slice('/cdn/arweave/'.length)}`,
    )}`;
  }

  if (value.startsWith('/')) return value;

  try {
    const url = new URL(value);
    if (!['https:', 'http:'].includes(url.protocol)) return defaultTokenIcon;

    return `/api/token-icon?url=${encodeURIComponent(url.toString())}`;
  } catch {
    return defaultTokenIcon;
  }
};

function TokenSearchLabel({
  icon,
  name,
  symbol,
  mintAddress,
}: {
  icon?: string | null;
  name: string;
  symbol?: string | null;
  mintAddress: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <img
        src={getTokenIconSrc(icon)}
        alt={symbol || name}
        className="h-4 w-4 shrink-0"
      />
      <div className="min-w-0">
        <p className="truncate text-sm">
          {name}
          {symbol ? <span className="text-slate-500"> ({symbol})</span> : null}
        </p>
        <p className="truncate text-xs text-slate-500">
          {truncatePublicKey(mintAddress, 6)}
        </p>
      </div>
    </div>
  );
}

function ReachOutMessage({ jupiterUrl }: { jupiterUrl?: string }) {
  return (
    <div className="flex flex-col gap-2 py-8 text-center text-sm">
      <p>Please reach out to us to add your token</p>
      <p className="mx-auto w-2/3 text-slate-500 sm:text-[0.6875rem]">
        {`Send us your token's`}{' '}
        {jupiterUrl ? (
          <a
            target="_blank"
            href={jupiterUrl}
            className="text-[#1C4CE7] hover:underline"
          >
            Jupiter link
          </a>
        ) : (
          'Jupiter link'
        )}{' '}
        at
        <CopyButton
          text={supportEmail}
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
            {supportEmail}
            <CopyIcon className="h-3 w-3" />
          </Badge>
        </CopyButton>
        to get it added.
      </p>
    </div>
  );
}

export function TokenSelect() {
  const form = useListingForm();
  const tokens = useTokenList();
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [jupiterTokens, setJupiterTokens] = useState<JupiterToken[]>([]);
  const [isSearchingJupiter, setIsSearchingJupiter] = useState(false);
  const [addingMintAddress, setAddingMintAddress] = useState<string | null>(
    null,
  );

  const trimmedSearchValue = searchValue.trim();
  const normalizedSearchValue = normalizeTokenSearchValue(trimmedSearchValue);
  const filteredTokens = useMemo(() => {
    if (!normalizedSearchValue) return tokens;

    return sortTokenSearchResults(
      tokens.filter(
        (token) =>
          normalizeTokenSearchValue(token.tokenName).includes(
            normalizedSearchValue,
          ) ||
          normalizeTokenSearchValue(token.tokenSymbol).includes(
            normalizedSearchValue,
          ) ||
          normalizeTokenSearchValue(token.mintAddress).includes(
            normalizedSearchValue,
          ),
      ),
      trimmedSearchValue,
    );
  }, [normalizedSearchValue, trimmedSearchValue, tokens]);

  const shouldSearchJupiter = normalizedSearchValue.length >= 2;
  const filteredJupiterTokens = useMemo(
    () =>
      sortJupiterTokenSearchResults(
        jupiterTokens.filter((token) => {
          const isDuplicateLocalToken = tokens.some(
            (localToken) => localToken.mintAddress === token.id,
          );

          return !isDuplicateLocalToken;
        }),
        trimmedSearchValue,
      ),
    [jupiterTokens, tokens, trimmedSearchValue],
  );
  const verifiedJupiterTokens = filteredJupiterTokens.filter(
    (token) => token.isVerified,
  );
  const unverifiedJupiterToken = filteredJupiterTokens.find(
    (token) => !token.isVerified,
  );

  useEffect(() => {
    if (!shouldSearchJupiter) {
      setJupiterTokens([]);
      setIsSearchingJupiter(false);
      return;
    }

    const abortController = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setIsSearchingJupiter(true);

      try {
        const response = await fetch(
          `/api/tokens?query=${encodeURIComponent(trimmedSearchValue)}`,
          {
            credentials: 'same-origin',
            cache: 'no-store',
            signal: abortController.signal,
          },
        );

        if (!response.ok) {
          throw new Error('Failed to search Jupiter tokens');
        }

        const data = (await response.json()) as TokenSearchResponse;
        setJupiterTokens(
          Array.isArray(data.jupiterTokens) ? data.jupiterTokens : [],
        );
      } catch (error) {
        if (abortController.signal.aborted) return;
        console.error('Failed to search Jupiter tokens', error);
        setJupiterTokens([]);
      } finally {
        if (!abortController.signal.aborted) {
          setIsSearchingJupiter(false);
        }
      }
    }, 350);

    return () => {
      window.clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [shouldSearchJupiter, trimmedSearchValue]);

  const addJupiterToken = async (
    mintAddress: string,
    onSelect: (value: string) => void,
  ) => {
    setAddingMintAddress(mintAddress);

    try {
      const response = await fetch('/api/tokens', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mintAddress }),
      });
      const data = (await response.json()) as AddTokenResponse;

      if (!response.ok || !data.token) {
        throw new Error(data.error || 'Failed to add token');
      }

      addTokenToList(data.token);
      onSelect(data.token.tokenSymbol);
      form.saveDraft();
      setSearchValue('');
      setOpen(false);
      toast.success(`${data.token.tokenSymbol} added`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to add token',
      );
    } finally {
      setAddingMintAddress(null);
    }
  };

  return (
    <FormField
      name="token"
      control={form?.control}
      render={({ field }) => {
        const localBestRank = filteredTokens[0]
          ? getTokenSearchRank({
              query: trimmedSearchValue,
              name: filteredTokens[0].tokenName,
              symbol: filteredTokens[0].tokenSymbol,
              mintAddress: filteredTokens[0].mintAddress,
              sortOrder: filteredTokens[0].sortOrder,
            })
          : Number.POSITIVE_INFINITY;
        const jupiterBestRank = verifiedJupiterTokens[0]
          ? getTokenSearchRank({
              query: trimmedSearchValue,
              name: verifiedJupiterTokens[0].name,
              symbol: verifiedJupiterTokens[0].symbol,
              mintAddress: verifiedJupiterTokens[0].id,
            })
          : Number.POSITIVE_INFINITY;
        const shouldShowJupiterFirst = jupiterBestRank < localBestRank;

        const localTokenResults =
          filteredTokens.length > 0 ? (
            <CommandGroup>
              {filteredTokens.map((token) => (
                <CommandItem
                  value={`${token.tokenName} ${token.tokenSymbol} ${token.mintAddress}`}
                  key={token.tokenSymbol}
                  onSelect={() => {
                    field.onChange(token.tokenSymbol);
                    form.saveDraft();
                    setOpen(false);
                  }}
                >
                  <TokenSearchLabel
                    icon={token.icon}
                    name={token.tokenName}
                    symbol={token.tokenSymbol}
                    mintAddress={token.mintAddress}
                  />
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
          ) : null;

        const jupiterTokenResults =
          shouldSearchJupiter &&
          !isSearchingJupiter &&
          verifiedJupiterTokens.length > 0 ? (
            <CommandGroup heading="Found on Jupiter">
              {verifiedJupiterTokens.map((token) => (
                <div
                  key={token.id}
                  className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm"
                >
                  <TokenSearchLabel
                    icon={token.icon}
                    name={token.name}
                    symbol={token.symbol}
                    mintAddress={token.id}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="ml-auto h-7 gap-1"
                    disabled={!!addingMintAddress}
                    onClick={() => addJupiterToken(token.id, field.onChange)}
                  >
                    {addingMintAddress === token.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Plus className="h-3 w-3" />
                    )}
                    Add
                  </Button>
                </div>
              ))}
            </CommandGroup>
          ) : null;

        return (
          <FormItem className="gap-2">
            <FormLabel>Payment</FormLabel>
            <Popover open={open} onOpenChange={setOpen}>
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
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Search token name, ticker, or mint address..."
                    className="h-9"
                    value={searchValue}
                    onValueChange={setSearchValue}
                  />
                  <CommandList>
                    {shouldShowJupiterFirst
                      ? jupiterTokenResults
                      : localTokenResults}
                    {shouldShowJupiterFirst
                      ? localTokenResults
                      : jupiterTokenResults}
                    {shouldSearchJupiter && isSearchingJupiter && (
                      <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Searching Jupiter
                      </div>
                    )}
                    {shouldSearchJupiter &&
                      !isSearchingJupiter &&
                      filteredJupiterTokens.length > 0 &&
                      verifiedJupiterTokens.length === 0 && (
                        <ReachOutMessage
                          jupiterUrl={
                            unverifiedJupiterToken
                              ? `https://jup.ag/tokens/${unverifiedJupiterToken.id}`
                              : undefined
                          }
                        />
                      )}
                    {shouldSearchJupiter &&
                      !isSearchingJupiter &&
                      filteredJupiterTokens.length === 0 &&
                      filteredTokens.length === 0 && <ReachOutMessage />}
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
