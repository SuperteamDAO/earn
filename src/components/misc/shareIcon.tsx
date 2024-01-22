import { Icon } from '@chakra-ui/react';
import React from 'react';
import { BiSolidShare } from 'react-icons/bi';

export function ShareIcon() {
  return <Icon as={BiSolidShare} ml={{ base: 0, md: -3 }} />;
}
