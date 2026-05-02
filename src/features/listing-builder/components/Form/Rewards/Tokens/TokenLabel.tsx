import { type ClassValue } from 'clsx';
import { useWatch } from 'react-hook-form';

import { type Token, useToken } from '@/constants/tokenList';
import { getRewardTokenDisplayName } from '@/lib/rewards/inKind';
import { cn } from '@/utils/cn';

import { useListingForm } from '../../../../hooks';

interface Props {
  symbol?: string;
  className?: ClassValue;
  showIcon?: boolean;
  showSymbol?: boolean;
  showName?: boolean;
  postfix?: string;
  amount?: number | null;
  token?: Token;
  classNames?: {
    icon?: ClassValue;
    symbol?: ClassValue;
    amount?: ClassValue;
    postfix?: ClassValue;
    name?: ClassValue;
  };
  formatter?: (amount: number) => string;
}

const defaultFormatter = (amount: number) =>
  new Intl.NumberFormat('en-US', {
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(amount);

export function TokenLabel({
  symbol,
  className,
  showIcon = true,
  showSymbol = false,
  showName = false,
  postfix,
  amount,
  classNames,
  token: preToken,
  formatter = defaultFormatter,
}: Props) {
  const form = useListingForm();
  const formToken = useWatch({
    control: form?.control,
    name: 'token',
  });

  const searchSymbol = symbol || formToken;
  const resolvedToken = useToken(searchSymbol);
  const token = preToken || resolvedToken;
  const displayedTokenLabel = getRewardTokenDisplayName(token?.tokenSymbol);

  if (!token) return null;
  return (
    <span className={cn('flex w-max items-center', className)}>
      {showIcon && (
        <img
          src={token.icon}
          alt={displayedTokenLabel}
          className={cn('mr-1 block h-4 w-4', classNames?.icon)}
        />
      )}
      {typeof amount === 'number' && !isNaN(amount) && (
        <span className={cn('ml-2 text-sm', classNames?.amount)}>
          {formatter(amount)}
        </span>
      )}
      {showName && (
        <span className={cn('ml-2 text-sm', classNames?.symbol)}>
          {token.tokenName}
        </span>
      )}
      {showSymbol && (
        <span className={cn('ml-2 text-sm', classNames?.symbol)}>
          {displayedTokenLabel}
        </span>
      )}
      {postfix && (
        <span className={cn('ml-1 text-sm', classNames?.postfix)}>
          {postfix}
        </span>
      )}
    </span>
  );
}
