import { Text, type TextProps } from '@chakra-ui/react';
import React from 'react';

import { formatNumberWithSuffix } from '@/utils/formatNumberWithSuffix';

interface CompensationAmountType {
  compensationType?: 'fixed' | 'range' | 'variable';
  rewardAmount?: number;
  minRewardAsk?: number;
  maxRewardAsk?: number;
  textStyle?: TextProps;
}

export const SponsorPrize = ({
  compensationType,
  rewardAmount,
  minRewardAsk,
  maxRewardAsk,
  textStyle,
}: CompensationAmountType) => {
  return (
    <Text {...textStyle}>
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
    </Text>
  );
};
