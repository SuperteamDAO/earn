import { StarIcon } from '@chakra-ui/icons';
import { HStack, Text } from '@chakra-ui/react';
import React from 'react';

import { BONUS_REWARD_POSITION } from '@/constants';
import { type Rewards } from '@/features/listings';
import { nthLabelGenerator } from '@/utils/rank';

export const Badge = ({
  position,
}: {
  position: keyof Rewards | undefined;
}) => {
  if (!position) return <></>;
  
  const positionNum = Number(position);
  if (positionNum === BONUS_REWARD_POSITION) return <></>;
  
  return (
    <HStack
      w="fit-content"
      h="1.2rem"
      px={2}
      color={positionNum === 1 ? '#D97706' : '#475569'}
      fontSize="sm"
      bg={positionNum === 1 ? '#FFF7ED' : '#F8FAFC'}
      rounded="full"
    >
      <StarIcon h={3} w={3} />
      <Text>{nthLabelGenerator(positionNum)}</Text>
    </HStack>
  );
};
