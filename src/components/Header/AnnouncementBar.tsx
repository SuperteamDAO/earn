import { Box, Link, Text, useMediaQuery } from '@chakra-ui/react';
import NextLink from 'next/link';
import React from 'react';

export const AnnouncementBar = () => {
  const [isSmallerThan800] = useMediaQuery('(max-width: 800px)');

  if (isSmallerThan800) {
    return (
      // <Box
      //   as={NextLink}
      //   display={'block'}
      //   w="full"
      //   color="black"
      //   bgColor={'#f1e7e6'}
      //   href={'/renaissance'}
      // >
      //   <Text
      //     p={3}
      //     fontSize={{ base: '11px', md: 'sm' }}
      //     fontWeight={500}
      //     textAlign="center"
      //   >
      //     <Link as={NextLink} textDecoration={'underline'} href="/renaissance">
      //       Click here
      //     </Link>{' '}
      //     to check out sidetracks for Renaissance — Solana&apos;s latest global
      //     hackathon
      //   </Text>
      // </Box>
      <Box
        as={NextLink}
        display={'block'}
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
          to check out Scribes — a content hackathon with prizes worth over
          $100k!
        </Text>
      </Box>
    );
  } else return;
};
