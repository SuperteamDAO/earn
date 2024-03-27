import { ArrowForwardIcon } from '@chakra-ui/icons';
import { Flex, Text, type TextProps } from '@chakra-ui/react';
import React from 'react';

interface CompensationAmountType {
  compensationType?: 'fixed' | 'range' | 'variable';
  rewardAmount?: number;
  minRewardAsk?: number;
  maxRewardAsk?: number;
  token?: string;
  textStyle?: TextProps;
}

const formatNumberWithSuffix = ({
  amount,
  skipThousands,
}: {
  amount: number;
  skipThousands: boolean;
}) => {
  if (isNaN(amount)) return null;

  if (amount < 1000 || (skipThousands && amount < 1000000))
    return amount?.toString();

  const suffixes = ['', 'k', 'm'];
  const tier = (Math.log10(amount) / 3) | 0;

  const adjustedTier = skipThousands ? Math.max(tier, 1) : tier;

  if (adjustedTier === 0) return amount.toString();

  const suffix = suffixes[adjustedTier];
  const scale = Math.pow(10, adjustedTier * 3);
  const scaled = amount / scale;

  const formattedNumber =
    scaled % 1 === 0 ? scaled.toString() : scaled.toFixed(1);

  return formattedNumber + suffix;
};

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
      <Text as="span" ml={1} color="brand.slate.400" fontWeight={400}>
        {token}
      </Text>
    );
  };
  return (
    <Text {...textStyle}>
      {(() => {
        switch (compensationType) {
          case 'fixed':
            return (
              <>
                {formatNumberWithSuffix({
                  amount: rewardAmount!,
                  skipThousands: true,
                })}
                <Token />
              </>
            );
          case 'range':
            return (
              <>
                {`${formatNumberWithSuffix({ amount: minRewardAsk!, skipThousands: false })}-${formatNumberWithSuffix({ amount: maxRewardAsk!, skipThousands: false })}`}
                <Token />
              </>
            );
          case 'variable':
            if (token) {
              return <>{token}</>;
            }
            return (
              <Flex align={'center'} gap={1}>
                Send Quote
                <ArrowForwardIcon />
              </Flex>
            );
          default:
            return null;
        }
      })()}
    </Text>
  );
};
