import { Container, Flex, Image } from '@chakra-ui/react';
import React from 'react';

export const Navbar = () => {
  return (
    <>
      <Container
        maxW={'full'}
        p={{ xs: 10, md: 0 }}
        h={14}
        position={'absolute'}
        zIndex={10}
        top={0}
        bg={'#F1F5F9'}
        borderBottom={'1px solid rgba(255, 255, 255, 0.15)'}
        sx={{
          backdropFilter: 'blur(10px)',
          margin: '0px !important',
          marginTop: '0px !important',
        }}
      >
        <Flex
          align={'center'}
          justify={'space-between'}
          h={'full'}
          maxW={['4xl', '5xl', '6xl', '7xl', '8xl']}
          mx="auto"
        >
          <Image src={'/assets/logo/logo.png'} alt={'logo'} />
        </Flex>
      </Container>
    </>
  );
};
