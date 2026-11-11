import { cn } from '@/utils/cn';
import { formatNumberWithSuffix } from '@/utils/formatNumberWithSuffix';

import { type InKindRewardMetadata, type Rewards } from '../types';

interface InKindRewardDisplayProps {
  item: InKindRewardMetadata;
  quantity: number;
  rewards?: Rewards;
  variant?: 'compact' | 'summary';
  className?: string;
  iconClassName?: string;
}

const quantityLabel = (quantity: number, item: InKindRewardMetadata) =>
  quantity === 1 ? item.name : item.pluralName;

function getDistributionLabel(rewards?: Rewards) {
  if (!rewards) return null;

  const quantities = Object.entries(rewards)
    .filter(([position]) => Number(position) > 0)
    .map(([, quantity]) => quantity);

  if (!quantities.length) return null;

  const firstQuantity = quantities[0];
  if (
    firstQuantity !== undefined &&
    quantities.every((quantity) => quantity === firstQuantity)
  ) {
    return `${formatNumberWithSuffix(firstQuantity, 2, true)} per winner`;
  }

  return `${quantities.length} ${quantities.length === 1 ? 'winner' : 'winners'}`;
}

export function InKindRewardDisplay({
  item,
  quantity,
  rewards,
  variant = 'compact',
  className,
  iconClassName,
}: InKindRewardDisplayProps) {
  const distributionLabel = getDistributionLabel(rewards);

  if (variant === 'summary') {
    return (
      <div
        className={cn(
          'bg-brand-purple/10 flex items-center gap-4 rounded-xl px-4 py-4',
          className,
        )}
      >
        <img
          src={item.icon}
          alt=""
          className={cn('size-9 shrink-0 object-contain', iconClassName)}
          aria-hidden="true"
        />
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold text-slate-900 md:text-xl">
            {formatNumberWithSuffix(quantity, 2, true)} ×{' '}
            {quantityLabel(quantity, item)}
          </p>
          {distributionLabel && (
            <p className="text-brand-purple text-sm font-medium md:text-base">
              {distributionLabel}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <span className={cn('flex items-center gap-1.5', className)}>
      <img
        src={item.icon}
        alt=""
        className={cn('size-4 shrink-0 object-contain', iconClassName)}
        aria-hidden="true"
      />
      <span className="font-semibold whitespace-nowrap text-slate-600">
        {formatNumberWithSuffix(quantity, 2, true)} ×{' '}
        {quantityLabel(quantity, item)}
      </span>
    </span>
  );
}

export { quantityLabel as getInKindRewardQuantityLabel };
