import { Box, Link, SlideFade, Text } from '@chakra-ui/react';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import React from 'react';
import { SolarMail } from '@/constants';

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
            使用本网站，您已同意我们的{' '}
            <Link
              as={NextLink}
              fontWeight={600}
              href={TERMS_OF_USE}
              isExternal
              rel="noopener noreferrer"
            >
              使用条款
            </Link>{' '}
            和我们的{' '}
            <Link
              as={NextLink}
              fontWeight={600}
              href={`${router.basePath}/privacy-policy.pdf`}
              isExternal
            >
              隐私政策
            </Link>
            。
          </Text>
        </Box>
        <Box
          flexDir={'column'}
          py={'7px'}
          bg={'brand.slate.100'}
          borderBottomRadius="6px"
        >
          <Text color="brand.slate.400" fontSize="xs" textAlign="center">
            需要帮助？请联系我们{' '}
            <Text as="u">
              <Link
                as={NextLink}
                href={`mailto:${SolarMail}`}
                isExternal
              >
                {SolarMail}
              </Link>
            </Text>
          </Text>
        </Box>
      </Box>
    </>
  );
};
