import { StarIcon } from '@chakra-ui/icons';
import { HStack, Text } from '@chakra-ui/react';
import React from 'react';

import { type Rewards } from '@/features/listings';
import { getRankLabels } from '@/utils/rank';

export const Badge = ({
  position,
}: {
  position: keyof Rewards | undefined;
}) => {
  position = Number(position);
  return (
    <HStack
      w="fit-content"
      px={2}
      color={position === 1 ? '#D97706' : '#475569'}
      bg={position === 1 ? '#FFF7ED' : '#F8FAFC'}
      rounded="full"
    >
      <StarIcon h={3} w={3} />
      <Text>{getRankLabels(position ?? 0)}</Text>
    </HStack>
  );
};
// fill = { position === 1 ? '#FFE4BB' : '#CBD5E1'}
// fill = { position === 1 ? '#FFB545' : '#334254'}
// fill = { position === 1 ? '#98733B' : '#64758B'}
