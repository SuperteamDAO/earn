import { ArrowRight } from 'lucide-react';
import React from 'react';

import { type CompensationType } from '@/prisma/enums';
import { cn } from '@/utils/cn';
import { formatNumberWithSuffix } from '@/utils/formatNumberWithSuffix';

interface CompensationAmountType {
  compensationType?: CompensationType;
  rewardAmount?: number | null;
  minRewardAsk?: number | null;
  maxRewardAsk?: number | null;
  token?: string | null;
  className?: string;
  style?: React.CSSProperties;
  showUsdSymbol?: boolean;
  isWinnersAnnounced?: boolean;
}

const TokenLabel = ({ token }: { token?: string | null }) => {
  return <span className="ml-1 text-slate-400">{token}</span>;
};

export const CompensationAmount = ({
  compensationType,
  rewardAmount,
  minRewardAsk,
  maxRewardAsk,
  token,
  className,
  style,
  showUsdSymbol,
  isWinnersAnnounced,
}: CompensationAmountType) => {
  const renderCompensation = () => {
    switch (compensationType) {
      case 'fixed':
        return (
          <>
            <span className="ml-auto">
              {showUsdSymbol ? '$' : ''}
              {formatNumberWithSuffix(rewardAmount!, 2, true)}
            </span>
            <TokenLabel token={token} />
          </>
        );
      case 'range':
        if (!isWinnersAnnounced) {
          return (
            <>
              {showUsdSymbol ? '$' : ''}
              {`${formatNumberWithSuffix(minRewardAsk!)}-${formatNumberWithSuffix(maxRewardAsk!)}`}
              <TokenLabel token={token} />
            </>
          );
        } else {
          return (
            <>
              {showUsdSymbol ? '$' : ''}
              {formatNumberWithSuffix(rewardAmount!, 2, true)}
              <TokenLabel token={token} />
            </>
          );
        }
      case 'variable':
        if (token && !isWinnersAnnounced) {
          return (
            <>
              {showUsdSymbol ? '$' : ''}
              {token}
            </>
          );
        }
        if (isWinnersAnnounced) {
          return (
            <>
              <span className="ml-auto">
                {showUsdSymbol ? '$' : ''}
                {formatNumberWithSuffix(rewardAmount!, 2, true)}
              </span>
              <TokenLabel token={token} />
            </>
          );
        }
        return null;
      default:
        return null;
    }
  };

  return (
    <>
      <div className={cn('flex', className)} style={style}>
        {renderCompensation()}
      </div>
      {compensationType === 'variable' && !token && !isWinnersAnnounced && (
        <div className="flex items-center gap-0.5 sm:gap-1">
          <span className={className}>Send Quote</span>
          <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
        </div>
      )}
    </>
  );
};
