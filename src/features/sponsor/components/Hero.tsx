import {
  Box,
  Button,
  Flex,
  HStack,
  Link,
  Text,
  VStack,
} from '@chakra-ui/react';
import NextLink from 'next/link';
import { useSession } from 'next-auth/react';
import { useTranslation } from 'next-i18next';
import { usePostHog } from 'posthog-js/react';

import Bonk from '@/public/assets/landingsponsor/sponsors/bonk.webp';
import De from '@/public/assets/landingsponsor/sponsors/de.webp';
import Jupiter from '@/public/assets/landingsponsor/sponsors/jupiter.webp';
import MadLads from '@/public/assets/landingsponsor/sponsors/madlads.webp';
import Meteora from '@/public/assets/landingsponsor/sponsors/meteora.webp';
import MonkeDao from '@/public/assets/landingsponsor/sponsors/monkedao.webp';
import Solflare from '@/public/assets/landingsponsor/sponsors/solflare.webp';
import Squads from '@/public/assets/landingsponsor/sponsors/squads.webp';
import Tensor from '@/public/assets/landingsponsor/sponsors/tensor.webp';
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
  const { t } = useTranslation('common');

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
            {t('hero.title')}
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
            {t('hero.description')}
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
                {t('hero.getStarted')}
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
            <HStack>
              <Text color="brand.slate.800" fontWeight={600}>
                {t('hero.step1')}
              </Text>
              <Text color="brand.slate.500" fontWeight={600}>
                {t('hero.createProfile')}
              </Text>
            </HStack>
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
            <HStack>
              <Text color="brand.slate.800" fontWeight={600}>
                {t('hero.step2')}
              </Text>
              <Text color="brand.slate.500" fontWeight={600}>
                {t('hero.postListing')}
              </Text>
            </HStack>
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
            <HStack>
              <Text color="brand.slate.800" fontWeight={600}>
                {t('hero.step3')}
              </Text>
              <Text color="brand.slate.500" fontWeight={600}>
                {t('hero.getSubmissions')}
              </Text>
            </HStack>
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
            height={22}
            src={Squads}
            alt={t('hero.squadsLogoAlt')}
            unoptimized={true}
            priority={true}
            loading="eager"
          />
          <HighQualityImage
            height={26}
            src={Tensor}
            alt={t('hero.tensorLogoAlt')}
            unoptimized={true}
            priority={true}
            loading="eager"
          />
          <HighQualityImage
            src={Jupiter}
            alt={t('hero.jupiterLogoAlt')}
            height={21}
            unoptimized={true}
            priority={true}
            loading="eager"
          />
          <HighQualityImage
            src={De}
            alt={t('hero.deLogoAlt')}
            height={48}
            unoptimized={true}
            priority={true}
            loading="eager"
          />
          <HighQualityImage
            src={MadLads}
            alt={t('hero.madLadsLogoAlt')}
            height={38}
            unoptimized={true}
            priority={true}
            loading="eager"
          />
          <HighQualityImage
            src={Solflare}
            alt={t('hero.solflareLogoAlt')}
            height={41}
            unoptimized={true}
            priority={true}
            loading="eager"
          />
          <HighQualityImage
            src={Meteora}
            alt={t('hero.meteoraLogoAlt')}
            height={28}
            unoptimized={true}
            priority={true}
            loading="eager"
          />
          <HighQualityImage
            src={MonkeDao}
            alt={t('hero.monkeDaoLogoAlt')}
            height={25}
            unoptimized={true}
            priority={true}
            loading="eager"
          />
          <HighQualityImage
            src={Bonk}
            alt={t('hero.bonkLogoAlt')}
            height={42}
            unoptimized={true}
            priority={true}
            loading="eager"
          />
        </Flex>
      </VStack>
    </>
  );
}
