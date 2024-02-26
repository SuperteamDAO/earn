import { ArrowForwardIcon } from '@chakra-ui/icons';
import { Flex } from '@chakra-ui/react';
import React from 'react';

interface CompensationAmountType {
  compensationType?: 'fixed' | 'range' | 'variable';
  rewardAmount?: number;
  minRewardAsk?: number;
  maxRewardAsk?: number;
}

const formatNumberWithSuffix = (number: number) => {
  if (isNaN(number)) return null;

  if (number < 1000) return number.toString();

  const suffixes = ['', 'K', 'M'];
  const tier = (Math.log10(number) / 3) | 0;

  if (tier === 0) return number.toString();

  const suffix = suffixes[tier];
  const scale = Math.pow(10, tier * 3);
  const scaled = number / scale;

  const formattedNumber =
    scaled % 1 === 0 ? scaled.toString() : scaled.toFixed(1);

  return formattedNumber + suffix;
};

export const CompensationAmount = ({
  compensationType,
  rewardAmount,
  minRewardAsk,
  maxRewardAsk,
}: CompensationAmountType) => {
  switch (compensationType) {
    case 'fixed':
      return <>{rewardAmount?.toLocaleString()}</>;
    case 'range':
      return (
        <>{`${formatNumberWithSuffix(minRewardAsk!)}-${formatNumberWithSuffix(maxRewardAsk!)}`}</>
      );
    case 'variable':
      return (
        <Flex align={'center'} gap={1}>
          Send Quote
          <ArrowForwardIcon />
        </Flex>
      );
    default:
      return null;
  }
};
