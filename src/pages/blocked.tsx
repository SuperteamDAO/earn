import { Box, Link, Text } from '@chakra-ui/react';
import React from 'react';

import { SolarMail } from '@/constants';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';

export default function Blocked() {
  return (
    <Default
      meta={
        <Meta
          title="Blocked | Solar Earn"
          description="Explore the latest bounties on Solar Earn, offering opportunities in the crypto space across Design, Development, and Content."
          canonical=""
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
          您的 Solar Earn 访问权限已受限。请联系相关人员获取帮助。{' '}
          <Link color={'brand.purple'} href={`mailto:${SolarMail}`}>
            {SolarMail}
          </Link>{' '}
          如需更多信息或有问题，请随时联系。
        </Text>
      </Box>
    </Default>
  );
}
