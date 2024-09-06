import { HStack, type StackProps, Text } from '@chakra-ui/react';

import { formatTotalPrice } from '@/features/listing-builder';
import { type Rewards } from '@/features/listings';
import { cleanRewards } from '@/utils/rank';

import { type Token } from './types';

type Props = StackProps & {
  rewards: Rewards | undefined;
  maxBonusSpots: number | undefined;
  selectedToken: Token | undefined;
  calculateTotalReward: () => number;
};
export function ShowTotalPrize({
  rewards,
  maxBonusSpots,
  selectedToken,
  calculateTotalReward,
  ...props
}: Props) {
  const calculateTotalPrizes = () =>
    cleanRewards(rewards, true).length + (maxBonusSpots ?? 0);
  return (
    <HStack {...props}>
      <Text>{calculateTotalPrizes()} Prizes</Text>
      <Text>
        {formatTotalPrice(calculateTotalReward())} {selectedToken?.tokenSymbol}{' '}
        Total
      </Text>
    </HStack>
  );
}
