import { Flex, Text } from '@chakra-ui/react';
import React from 'react';

interface StatusBadgeProps {
  textColor: string;
  text: string;
  Icon: React.JSX.Element;
}

export const StatusBadge = ({ textColor, text, Icon }: StatusBadgeProps) => {
  return (
    <Flex
      align="center"
      gap={2}
      py={1}
      color={textColor}
      fontSize={{ base: 'xs', sm: 'sm' }}
      fontWeight={500}
      whiteSpace={'nowrap'}
      rounded={'full'}
    >
      {Icon}
      <Text>{text}</Text>
    </Flex>
  );
};
