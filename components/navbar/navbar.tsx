import { Container, Flex, Image } from '@chakra-ui/react';
import React from 'react';

export const Navbar = () => {
  return (
    <>
      <Flex
        align={'center'}
        px={20}
        justify={'space-between'}
        bg={'#F1F5F9'}
        h={'5rem'}
      >
        <Image src={'/assets/logo/logo.png'} alt={'logo'} />
      </Flex>
    </>
  );
};
