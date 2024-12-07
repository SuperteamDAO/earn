import { Box, Button, Flex, Link, Text, VStack } from '@chakra-ui/react';
import NextLink from 'next/link';
import { useSession } from 'next-auth/react';
import { usePostHog } from 'posthog-js/react';

import { useUser } from '@/store/user';

import { fontSize, maxW, padding } from '../utils';
import { HighQualityImage } from './HighQualityImage';
import { StepOne } from './steps/One';
import { StepThree } from './steps/Three';
import { StepTwo } from './steps/Two';

export function Hero() {
  const { data: session } = useSession();

  const { user } = useUser();

  const posthog = usePostHog();

  const base = '/landingsponsor/sponsors/';

  function getStartedWhere(authenticated: boolean, isSponsor: boolean) {
    if (!authenticated) return '/new/sponsor';
    if (!isSponsor) return '/new/sponsor';
    return '/dashboard/listings/?open=1';
  }
  return (
    <>
      <VStack
        pos="relative"
        align="center"
        justify="start"
        overflow="hidden"
        w="100%"
        pb={{ base: '4rem', md: '1rem' }}
      >
        <Flex
          pos="relative"
          align="center"
          gap="1.875rem"
          w={{ base: '100%' }}
          px="1.875rem"
          pt="9.375rem"
          textAlign="center"
          bg="#F8FAFC"
          flexFlow="column"
        >
          <Text
            maxW="45rem"
            color="gray.700"
            fontSize={fontSize}
            fontWeight={'600'}
            lineHeight="1.15em"
            letterSpacing={'-0.04em'}
          >
            Where Solana teams come to get sh*t done
          </Text>
          <Text
            w="100%"
            maxW="39rem"
            color="gray.500"
            fontSize={{ base: '1.25rem' }}
            fontWeight={500}
            css={{
              textWrap: 'pretty',
            }}
          >
            The world’s best Solana talent is on Superteam Earn. Get work done
            from the right people, at the right time.
          </Text>

          <Flex justify="center" gap="2rem" w="100%">
            <Link
              className="ph-no-capture"
              as={NextLink}
              href={getStartedWhere(!!session, !!user?.currentSponsorId)}
              onClick={() => {
                posthog?.capture('clicked_hero_get_started');
              }}
            >
              <Button
                w="12.5rem"
                h="3.125rem"
                mx="auto"
                color={'white'}
                fontSize="1.125rem"
                bg={'#6562FF'}
                borderRadius="0.625rem"
                variant={'solid'}
              >
                Get Started
              </Button>
            </Link>
          </Flex>
          <Box pos="absolute" bottom="-12rem" w="full" h="12rem" bg="#F8FAFC" />
        </Flex>
        <Flex
          pos="relative"
          align="center"
          direction={{ base: 'column', md: 'row' }}
          gap={{ base: 6, md: 0 }}
          mt={8}
          transform={{
            base: 'scale(1)',
            md: 'scale(0.7)',
            lg: 'scale(0.8)',
            xl: 'scale(1)',
          }}
        >
          <VStack align="start">
            <StepOne />
            <div className="flex gap-2">
              <Text color="brand.slate.800" fontWeight={600}>
                STEP 1
              </Text>
              <Text color="brand.slate.500" fontWeight={600}>
                Create a profile
              </Text>
            </div>
          </VStack>
          <Box
            pos="relative"
            top="-1.0rem"
            display={{ base: 'none', md: 'block' }}
          >
            <svg
              width="23"
              height="2"
              viewBox="0 0 23 2"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M0.5 1H23" stroke="#CBD5E1" />
            </svg>
          </Box>
          <VStack align="start">
            <StepTwo />
            <div className="flex gap-2">
              <Text color="brand.slate.800" fontWeight={600}>
                STEP 2
              </Text>
              <Text color="brand.slate.500" fontWeight={600}>
                Post your listing
              </Text>
            </div>
          </VStack>

          <Box
            pos="relative"
            top="-1.0rem"
            display={{ base: 'none', md: 'block' }}
          >
            <svg
              width="24"
              height="216"
              viewBox="0 0 24 216"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M0 109H11.5M11.5 109V1H23.5M11.5 109H23.5M11.5 109V215.5H23.5"
                stroke="#CBD5E1"
              />
            </svg>
          </Box>
          <VStack align="start">
            <StepThree />
            <div className="flex gap-2">
              <Text color="brand.slate.800" fontWeight={600}>
                STEP 3
              </Text>
              <Text color="brand.slate.500" fontWeight={600}>
                Get submissions
              </Text>
            </div>
          </VStack>
        </Flex>
        <Flex
          align="center"
          justify="space-around"
          wrap="wrap"
          gap="1.25rem"
          w="100%"
          maxW={maxW}
          h="7.5rem"
          mx="auto"
          mt="2rem"
          mb="3.125rem"
          px={padding}
        >
          <HighQualityImage
            src={base + 'squads.webp'}
            alt="Squads Logo"
            className="h-6"
          />
          <HighQualityImage
            src={base + 'tensor.webp'}
            alt="Tensor Logo"
            className="h-8"
          />
          <HighQualityImage
            src={base + 'jupiter.webp'}
            alt="Jupiter Logo"
            className="h-6"
          />
          <HighQualityImage
            src={base + 'de.webp'}
            alt="De Logo"
            className="h-12"
          />
          <HighQualityImage
            src={base + 'madlads.webp'}
            alt="Madlads  Logo"
            className="h-10"
          />
          <HighQualityImage
            src={base + 'solflare.webp'}
            alt="Solflare Logo"
            className="h-10"
          />
          <HighQualityImage
            src={base + 'meteora.webp'}
            alt="Meteroa Logo"
            className="h-8"
          />
          <HighQualityImage
            src={base + 'monkedao.webp'}
            alt="MonkeDao Logo"
            className="h-6"
          />
          <HighQualityImage
            src={base + 'bonk.webp'}
            alt="Bonk Logo"
            className="h-8"
          />
        </Flex>
      </VStack>
    </>
  );
}
