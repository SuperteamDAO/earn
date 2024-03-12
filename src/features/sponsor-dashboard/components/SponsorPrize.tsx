import { Text, type TextProps } from '@chakra-ui/react';
import React from 'react';

interface CompensationAmountType {
  compensationType?: 'fixed' | 'range' | 'variable';
  rewardAmount?: number;
  minRewardAsk?: number;
  maxRewardAsk?: number;
  textStyle?: TextProps;
}

const formatNumberWithSuffix = ({ amount }: { amount: number }) => {
  if (isNaN(amount)) return null;

  if (amount < 1000) return amount.toString();

  const suffixes = ['', 'k', 'm'];
  const tier = (Math.log10(amount) / 3) | 0;

  if (tier === 0) return amount.toString();

  const suffix = suffixes[tier];
  const scale = Math.pow(10, tier * 3);
  const scaled = amount / scale;

  const formattedNumber =
    scaled % 1 === 0 ? scaled.toString() : scaled.toFixed(1);

  return formattedNumber + suffix;
};

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
