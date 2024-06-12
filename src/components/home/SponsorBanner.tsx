import { ArrowForwardIcon } from '@chakra-ui/icons';
import { Link, Text, VStack } from '@chakra-ui/react';
import Image from 'next/image';
import NextLink from 'next/link';

import Briefcase from '@/public/assets/home/display/briefcase.png';

export const SponsorBanner = () => {
  return (
    <Link
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
      rounded="lg"
    >
      <VStack align="start">
        <Text fontWeight={500} _groupHover={{ textDecoration: 'underline' }}>
          Become a Sponsor
          <ArrowForwardIcon ml={1} color="#777777" w={6} />
        </Text>
        <Text color="brand.slate.500">
          Reach 20,000+ crypto talent from one single dashboard
        </Text>
      </VStack>
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
