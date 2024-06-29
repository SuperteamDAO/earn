import { Text } from '@chakra-ui/react';
import React from 'react';

interface StatusBadgeProps {
  textColor: string;
  bgColor: string;
  text: string;
}

export const StatusBadge = ({ textColor, bgColor, text }: StatusBadgeProps) => {
  return (
    <Text
      px={3}
      py={1}
      color={textColor}
      fontSize={{ base: 'xx-small', sm: 'xs' }}
      fontWeight={500}
      bg={bgColor}
      whiteSpace={'nowrap'}
      rounded={'full'}
    >
      {text}
    </Text>
  );
};
