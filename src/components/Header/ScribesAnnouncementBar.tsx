import { Box, Link, Text, useBreakpointValue } from '@chakra-ui/react';
import NextLink from 'next/link';
import React from 'react';

export const ScribesAnnouncementBar = () => {
  const display = useBreakpointValue({ base: 'block', md: 'none' });
  return (
    <Box
      as={NextLink}
      display={display}
      w="full"
      color="white"
      bgColor={'#a459ff'}
      href={'/scribes'}
    >
      <Text
        p={3}
        fontSize={{ base: '11px', md: 'sm' }}
        fontWeight={500}
        textAlign="center"
      >
        <Link as={NextLink} textDecoration={'underline'} href="/scribes">
          Click here
        </Link>{' '}
        to check out Scribes — a content hackathon with prizes worth over $100k!
      </Text>
    </Box>
  );
};
