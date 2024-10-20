import { Text, VStack } from '@chakra-ui/react';
import * as Sentry from '@sentry/nextjs';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';

export default function Unauthorized() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      Sentry.captureMessage(`Unauthorized Access: ${router.asPath}`, {
        level: 'warning',
        extra: {
          route: router.asPath,
        },
      });
    }
  }, [router.asPath]);

  return (
    <>
      <Default
        meta={
          <Meta
            title="Unauthorized | Superteam Earn"
            description="401 - Unauthorized"
          />
        }
      >
        <VStack
          align={'center'}
          justify={'start'}
          gap={4}
          minH={'100vh'}
          mt={20}
        >
          {/* <Image alt="Unauthorized page" src="/assets/bg/unauthorized.svg" /> */}
          <Text color="black" fontSize={'xl'} fontWeight={500}>
            Unauthorized Access
          </Text>
          <Text
            maxW={'2xl'}
            color="gray.500"
            fontSize={['md', 'md', 'lg', 'lg']}
            fontWeight={400}
            textAlign={'center'}
          >
            Sorry, you do not have permission to view this page. Please contact
            the administrator if you believe this is an error.
          </Text>
          {/* <Image
            w={['20rem', '20rem', '30rem', '30rem']}
            alt="lock image"
            src="/assets/bg/lock.svg"
          /> */}
        </VStack>
      </Default>
    </>
  );
}