import { ArrowRight } from 'lucide-react';
import React from 'react';

import { cn } from '@/utils/cn';
import { formatNumberWithSuffix } from '@/utils/formatNumberWithSuffix';

interface CompensationAmountType {
  compensationType?: 'fixed' | 'range' | 'variable';
  rewardAmount?: number;
  minRewardAsk?: number;
  maxRewardAsk?: number;
  token?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const CompensationAmount = ({
  compensationType,
  rewardAmount,
  minRewardAsk,
  maxRewardAsk,
  token,
  className,
  style,
}: CompensationAmountType) => {
  const Token = () => {
    return <span className="ml-1 text-slate-400">{token}</span>;
  };

  const renderCompensation = () => {
    switch (compensationType) {
      case 'fixed':
        return (
          <>
            <span className="ml-auto">
              {formatNumberWithSuffix(rewardAmount!, 2, true)}
            </span>
            <Token />
          </>
        );
      case 'range':
        return (
          <>
            {`${formatNumberWithSuffix(minRewardAsk!)}-${formatNumberWithSuffix(maxRewardAsk!)}`}
            <Token />
          </>
        );
      case 'variable':
        if (token) {
          return <>{token}</>;
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
      {compensationType === 'variable' && !token && (
        <div className="flex items-center gap-1">
          <span className={className}>Send Quote</span>
          <ArrowRight className="h-4 w-4" />
        </div>
      )}
    </>
  );
};
