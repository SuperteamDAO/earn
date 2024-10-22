import {
  Avatar,
  AvatarGroup,
  Box,
  Button,
  Flex,
  Show,
  Text,
} from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import { usePostHog } from 'posthog-js/react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { AuthWrapper } from '@/features/auth';
import DesktopBanner from '@/public/assets/home/display/banner.webp';
import MobileBanner from '@/public/assets/home/display/banner-mobile.webp';

import { userCountQuery } from '../queries/user-count';

const avatars = [
  {
    name: 'Abhishkek',
    src: '/assets/pfps/t1.webp',
  },
  {
    name: 'Pratik',
    src: '/assets/pfps/md2.webp',
  },
  {
    name: 'Yash',
    src: '/assets/pfps/fff1.webp',
  },
];

export function HomeBanner() {
  const posthog = usePostHog();
  const { t } = useTranslation('common');

  const { data } = useQuery(userCountQuery);

  return (
    <Box
      pos="relative"
      w={'100%'}
      h={{ base: '260', md: '280' }}
      maxH={'500px'}
      mx={'auto'}
      my={3}
      p={{ base: '5', md: '10' }}
      rounded={'md'}
    >
      <Show above="sm">
        <Image
          src={DesktopBanner}
          alt={t('Banner.desktopImageAlt')}
          layout="fill"
          objectFit="cover"
          quality={95}
          priority
          loading="eager"
          sizes="70vw"
          style={{
            width: '100%',
            maxWidth: '100%',
            borderRadius: 'var(--chakra-radii-md)',
            pointerEvents: 'none',
          }}
        />
      </Show>
      <Show below="sm">
        <Image
          src={MobileBanner}
          alt={t('Banner.mobileImageAlt')}
          layout="fill"
          objectFit="cover"
          quality={95}
          priority
          loading="eager"
          sizes="100vw"
          style={{
            width: '100%',
            maxWidth: '100%',
            borderRadius: 'var(--chakra-radii-md)',
          }}
        />
      </Show>
      <Text
        pos="relative"
        zIndex={1}
        color="white"
        fontSize={{ base: '2xl', md: '28px' }}
        fontWeight={'700'}
        lineHeight={'120%'}
      >
        {t('Banner.title')}
      </Text>
      <Text
        pos="relative"
        zIndex={1}
        maxW={{ base: '100%', md: '30rem' }}
        mt={{ base: '2.5', md: '4' }}
        color={'white'}
        fontSize={{ base: '13px', md: 'lg' }}
        lineHeight={'130%'}
      >
        {t('Banner.description')}
      </Text>
      <Flex
        zIndex={1}
        align={'center'}
        direction={{ base: 'column', md: 'row' }}
        gap={{ base: '3', md: '4' }}
        mt={'4'}
      >
        <AuthWrapper
          style={{
            w: { base: '100%', md: 'auto' },
            cursor: 'pointer',
          }}
        >
          <Button
            className="ph-no-capture"
            w={{ base: '100%', md: 'auto' }}
            px={'2.25rem'}
            py={'0.75rem'}
            color={'#3223A0'}
            fontSize={'0.875rem'}
            bg={'white'}
            onClick={() => {
              posthog.capture('signup_banner');
            }}
          >
            {t('Banner.signUpButton')}
          </Button>
        </AuthWrapper>
        <Flex align="center">
          <AvatarGroup max={3} size={{ base: 'xs', md: 'sm' }}>
            {avatars.map((avatar, index) => (
              <Avatar
                key={index}
                pos="relative"
                borderWidth={'1px'}
                borderColor={'#49139c'}
                name={avatar.name}
                src={avatar.src}
              />
            ))}
          </AvatarGroup>
          {data?.totalUsers !== null && (
            <Text
              pos="relative"
              ml={'0.6875rem'}
              color="brand.slate.200"
              fontSize={{ base: '0.8rem', md: '0.875rem' }}
            >
              {t('Banner.joinOthers', {
                count: data?.totalUsers,
              })}
            </Text>
          )}
        </Flex>
      </Flex>
    </Box>
  );
}
