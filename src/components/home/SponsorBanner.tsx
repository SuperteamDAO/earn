import { ArrowForwardIcon } from '@chakra-ui/icons';
import { Box, Link, Text } from '@chakra-ui/react';
import Image from 'next/image';
import NextLink from 'next/link';
import { usePostHog } from 'posthog-js/react';

import Briefcase from '@/public/assets/home/display/briefcase.png';

export const SponsorBanner = () => {
  const posthog = usePostHog();
  return (
    <Link
      className="ph-no-capture"
      as={NextLink}
      justifyContent="space-between"
      gap={4}
      display="flex"
      w="full"
      p={4}
      bg="brand.purple.50"
      _hover={{ textDecoration: 'none' }}
      data-group
      href="/sponsor"
      onClick={() => posthog?.capture('become a sponsor_banner')}
      rounded="lg"
    >
      <Box>
        <Text
          color={'brand.slate.600'}
          fontWeight={600}
          _groupHover={{ textDecoration: 'underline' }}
        >
          Become a Sponsor
          <ArrowForwardIcon ml={1} color="#777777" w={6} />
        </Text>
        <Text
          mt={1}
          color="brand.slate.500"
          fontSize={'sm'}
          fontWeight={500}
          lineHeight={'1.1rem'}
        >
          Reach 20,000+ crypto talent from one single dashboard
        </Text>
      </Box>
      <Image
        alt="Sponsor Briefcase"
        src={Briefcase}
        style={{
          flex: 1,
          width: '4rem',
          objectFit: 'contain',
          marginRight: '1rem',
        }}
      />
    </Link>
  );
};
