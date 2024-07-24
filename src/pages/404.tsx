import { Image, Text, VStack } from '@chakra-ui/react';
import * as Sentry from '@sentry/nextjs';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';

export default function Custom404() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      Sentry.captureMessage(`Page Not Found: ${router.asPath}`, {
        level: 'error',
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
            title="Superteam Earn | Page Not Found"
            description="404 - Page Not Found"
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
          <Image alt="404 page" src="/assets/bg/404.svg" />
          <Text color="black" fontSize={'xl'} fontWeight={500}>
            Nothing Found
          </Text>
          <Text
            maxW={'2xl'}
            color="gray.500"
            fontSize={['md', 'md', 'lg', 'lg']}
            fontWeight={400}
            textAlign={'center'}
          >
            Sorry, we couldn&apos;t find what you were looking for. It’s
            probably your own fault, please check your spelling or meanwhile
            have a look at this cat
          </Text>
          <Image
            w={['20rem', '20rem', '30rem', '30rem']}
            alt="cat image"
            src="/assets/bg/cat.svg"
          />
        </VStack>
      </Default>
    </>
  );
}
