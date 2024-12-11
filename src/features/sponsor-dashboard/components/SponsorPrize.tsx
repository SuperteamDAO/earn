import React from 'react';

import { formatNumberWithSuffix } from '@/utils/formatNumberWithSuffix';

interface CompensationAmountType {
  compensationType?: 'fixed' | 'range' | 'variable';
  rewardAmount?: number;
  minRewardAsk?: number;
  maxRewardAsk?: number;
  className?: string;
}

export const SponsorPrize = ({
  compensationType,
  rewardAmount,
  minRewardAsk,
  maxRewardAsk,
  className,
}: CompensationAmountType) => {
  return (
    <p className={className}>
      {(() => {
        switch (compensationType) {
          case 'fixed':
            return <>{formatNumberWithSuffix(rewardAmount!, 2, true)}</>;
          case 'range':
            return (
              <>
                {`${formatNumberWithSuffix(minRewardAsk!)}-${formatNumberWithSuffix(maxRewardAsk!)}`}
              </>
            );
          case 'variable':
            return <>Variable</>;
          default:
            return null;
        }
      })()}
    </p>
  );
};
