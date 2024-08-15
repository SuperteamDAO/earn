import { Text } from '@chakra-ui/react';
import React from 'react';

interface StatusBadgeProps {
  textColor: string;
  text: string;
  Icon: React.JSX.Element;
}

export const StatusBadge = ({ textColor, text, Icon }: StatusBadgeProps) => {
  return (
    <Text
      alignItems="center"
      gap={2}
      display="flex"
      py={1}
      color={textColor}
      fontSize={{ base: 'xs', sm: 'sm' }}
      fontWeight={500}
      whiteSpace={'nowrap'}
      rounded={'full'}
    >
      {Icon}
      {text}
    </Text>
  );
};
