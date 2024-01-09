import { Icon } from '@chakra-ui/react';
import React from 'react';
import { IoMdShareAlt } from 'react-icons/io';

export function ShareIcon() {
  return <Icon as={IoMdShareAlt} ml={{ base: 0, md: -3 }} />;
}
