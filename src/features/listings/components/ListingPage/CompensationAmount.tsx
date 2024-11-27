import { ArrowForwardIcon } from '@chakra-ui/icons';
import { Flex, Text, type TextProps } from '@chakra-ui/react';
import React from 'react';

import { formatNumberWithSuffix } from '@/utils/formatNumberWithSuffix';

interface CompensationAmountType {
  compensationType?: 'fixed' | 'range' | 'variable';
  rewardAmount?: number;
  minRewardAsk?: number;
  maxRewardAsk?: number;
  token?: string;
  textStyle?: TextProps;
}

export const CompensationAmount = ({
  compensationType,
  rewardAmount,
  minRewardAsk,
  maxRewardAsk,
  textStyle,
  token,
}: CompensationAmountType) => {
  const Token = () => {
    return (
      <Text as="span" ml={1} color="brand.slate.400">
        {token}
      </Text>
    );
  };

  const renderCompensation = () => {
    switch (compensationType) {
      case 'fixed':
        return (
          <>
            <Text ml="auto">
              {formatNumberWithSuffix(rewardAmount!, 2, true)}
            </Text>
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
      <Flex {...textStyle}>{renderCompensation()}</Flex>
      {compensationType === 'variable' && !token && (
        <Flex align={'center'} gap={1}>
          <Text {...textStyle}>发送报价</Text>
          <ArrowForwardIcon />
        </Flex>
      )}
    </>
  );
};
