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
            return <>{rewardAmount?.toLocaleString()}</>;
          case 'range':
            return (
              <>
                {`${formatNumberWithSuffix({ amount: minRewardAsk! })}-${formatNumberWithSuffix({ amount: maxRewardAsk! })}`}
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
