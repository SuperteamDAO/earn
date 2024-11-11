import { Box, Link, Text } from '@chakra-ui/react';
import React from 'react';

import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';

export default function Blocked() {
  return (
    <Default
      meta={
        <Meta
          title="Blocked | Solar Earn"
          description="Explore the latest bounties on Solar Earn, offering opportunities in the crypto space across Design, Development, and Content."
          canonical="https://earn.superteam.fun"
        />
      }
    >
      <Box maxW={'800px'} mx="auto" mt={10} px={4}>
        <Text
          color={'brand.slate.600'}
          fontSize="3xl"
          fontWeight={500}
          textAlign={'center'}
        >
          Your access to Earn has been restricted. Please get in touch with{' '}
          <Link color={'brand.purple'} href="mailto:support@superteamearn.com">
            support@superteamearn.com
          </Link>{' '}
          if you have any questions for more information.
        </Text>
      </Box>
    </Default>
  );
}
