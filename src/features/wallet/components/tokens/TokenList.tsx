import { BiSolidCoinStack } from 'react-icons/bi';

import { formatNumberWithSuffix } from '@/utils/formatNumberWithSuffix';

import { type TokenAsset } from '../../types/TokenAsset';
import { TokenSkeleton } from './TokenSkeleton';

interface TokenListProps {
  tokens: TokenAsset[];
  isLoading: boolean;
  error: Error | null;
}

export function TokenList({ tokens, isLoading, error }: TokenListProps) {
  if (isLoading) {
    return (
      <div>
        <TokenSkeleton />
        <TokenSkeleton />
        <TokenSkeleton />
      </div>
    );
  }

  if (error) {
    return <div className="px-8 py-4 text-red-500">Failed to load tokens</div>;
  }

  if (!tokens?.length) {
    return (
      <div className="flex flex-col items-center gap-1 px-6 py-12">
        <BiSolidCoinStack className="h-10 w-10 text-slate-400" />
        <p className="mt-6 text-center text-lg font-medium text-slate-400">
          No tokens received
        </p>
        <p className="px-4 text-center text-sm text-slate-400">
          Any tokens you receive will appear here when a sponsor pays out
        </p>
      </div>
    );
  }

  return (
    <div className="mt-0.5">
      {tokens.map((token) => (
        <div key={token.tokenAddress} className="overflow-hidden">
          <div className="h-auto w-full px-6 py-2 sm:px-8 sm:py-4">
            <div className="flex w-full items-center justify-between">
              <div className="flex items-center gap-3">
                {token.tokenImg && (
                  <img
                    src={token.tokenImg}
                    alt=""
                    className="h-9 w-9 rounded-full sm:h-10 sm:w-10"
                  />
                )}
                <div className="text-left">
                  <div className="text-sm font-semibold tracking-tight text-slate-900 sm:text-base">
                    {token.tokenName}
                  </div>
                  <div className="text-xs font-medium text-slate-500 sm:text-sm">
                    {token.tokenSymbol}
                  </div>
                </div>
              </div>
              <div>
                <div className="flex gap-1 text-sm font-semibold tracking-tight text-slate-500 sm:text-base">
                  <span className="text-slate-900">
                    {token.amount.toLocaleString()}
                  </span>
                  {token.tokenSymbol}
                </div>
                <div className="text-right text-xs text-slate-500 sm:text-sm">
                  ${formatNumberWithSuffix(token.usdValue, 3, true)}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
