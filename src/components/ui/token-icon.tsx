import { useTokenLookup } from '@/constants/tokenList';
import { isInKindReward } from '@/lib/rewards/inKind';
import { cn } from '@/utils/cn';

import { LocalImage } from './local-image';
import { Skeleton } from './skeleton';

interface TokenIconProps {
  symbol?: string | null;
  alt?: string;
  className?: string;
}

export function TokenIcon({
  symbol,
  alt = 'token',
  className,
}: TokenIconProps) {
  const { tokens, getBySymbol, getIcon } = useTokenLookup();
  const token = getBySymbol(symbol);
  const isLoading =
    !!symbol && !isInKindReward(symbol) && !token && tokens.length === 0;

  if (isLoading) {
    return <Skeleton className={cn('rounded-full', className)} />;
  }

  return <LocalImage src={getIcon(symbol)} alt={alt} className={className} />;
}
