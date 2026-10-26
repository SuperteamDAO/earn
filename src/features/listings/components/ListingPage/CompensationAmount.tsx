import React from 'react';

import { cn } from '@/utils/cn';
import { formatNumberWithSuffix } from '@/utils/formatNumberWithSuffix';

interface CompensationAmountType {
  compensationType?: 'fixed' | 'range' | 'variable';
  rewardAmount?: number;
  token?: string;
  className?: string;
  style?: React.CSSProperties;
  showUsdSymbol?: boolean;
}

export const CompensationAmount = ({
  compensationType,
  rewardAmount,
  token,
  className,
  style,
  showUsdSymbol,
}: CompensationAmountType) => {
  return (
    <div className={cn('flex', className)} style={style}>
      {compensationType === 'fixed' && (
        <>
          <span className="ml-auto">
            {showUsdSymbol ? '$' : ''}
            {formatNumberWithSuffix(rewardAmount ?? 0, 2, true)}
          </span>
          <span className="ml-1 text-slate-400">{token}</span>
        </>
      )}
    </div>
  );
};
