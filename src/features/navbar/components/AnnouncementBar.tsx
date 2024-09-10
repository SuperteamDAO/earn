import { Box, Link, Text, useMediaQuery } from '@chakra-ui/react';
import NextLink from 'next/link';
import React from 'react';

export const AnnouncementBar = () => {
  const [isSmallerThan800] = useMediaQuery('(max-width: 800px)');

  const href = '/hackathon/radar';
  if (isSmallerThan800) {
    return (
      <Box
        as={NextLink}
        display={'block'}
        w="full"
        color="white"
        bgColor={'brand.purple'}
        href={href}
      >
        <Text
          p={3}
          fontSize={{ base: '11px', md: 'sm' }}
          fontWeight={500}
          textAlign="center"
        >
          <Link as={NextLink} textDecoration={'underline'} href={href}>
            Click here
          </Link>{' '}
          to unlock $250k+ in prizes at Solana’s global hackathon, exclusively
          on Earn
        </Text>
      </Box>
    );
  } else return null;
};
