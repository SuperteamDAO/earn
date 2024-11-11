import { Box, Link, SlideFade, Text } from '@chakra-ui/react';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import React from 'react';

import { TERMS_OF_USE } from '@/constants';

import { EmailSignIn } from './EmailSignIn';

export const SignIn = () => {
  const router = useRouter();

  return (
    <>
      <Box>
        <Box px={6}>
          <Box>
            <SlideFade in={true} offsetY="20px">
              <EmailSignIn />
            </SlideFade>
          </Box>
          <Text
            mt={4}
            mb={2}
            color="brand.slate.500"
            fontSize="xs"
            textAlign="center"
          >
            By using this website, you agree to our{' '}
            <Link
              as={NextLink}
              fontWeight={600}
              href={TERMS_OF_USE}
              isExternal
              rel="noopener noreferrer"
            >
              Terms of Use
            </Link>{' '}
            and our{' '}
            <Link
              as={NextLink}
              fontWeight={600}
              href={`${router.basePath}/privacy-policy.pdf`}
              isExternal
            >
              Privacy Policy
            </Link>
            .
          </Text>
        </Box>
        <Box
          flexDir={'column'}
          py={'7px'}
          bg={'brand.slate.100'}
          borderBottomRadius="6px"
        >
          <Text color="brand.slate.400" fontSize="xs" textAlign="center">
            Need help? Reach out to us at{' '}
            <Text as="u">
              <Link
                as={NextLink}
                href={'mailto:vesper.yang.blockchain@gmail.com'}
                isExternal
              >
                vesper.yang.blockchain@gmail.com
              </Link>
            </Text>
          </Text>
        </Box>
      </Box>
    </>
  );
};
