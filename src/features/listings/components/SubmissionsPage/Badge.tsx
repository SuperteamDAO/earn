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
  if (position === BONUS_REWARD_POSITION) return <></>;
  position = Number(position);
  return (
    <HStack
      w="fit-content"
      h="1.2rem"
      px={2}
      color={position === 1 ? '#D97706' : '#475569'}
      fontSize="sm"
      bg={position === 1 ? '#FFF7ED' : '#F8FAFC'}
      rounded="full"
    >
      <StarIcon h={3} w={3} />
      {position !== BONUS_REWARD_POSITION && (
        <Text>{nthLabelGenerator(position ?? 0)}</Text>
      )}
    </HStack>
  );
};
