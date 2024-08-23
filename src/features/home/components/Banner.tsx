import {
  Avatar,
  AvatarGroup,
  Box,
  Button,
  Flex,
  Text,
  useMediaQuery,
} from '@chakra-ui/react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { usePostHog } from 'posthog-js/react';
import React from 'react';

import { AuthWrapper } from '@/features/auth';
import DesktopBanner from '@/public/assets/home/display/banner.webp';
import MobileBanner from '@/public/assets/home/display/banner-mobile.webp';

interface BannerProps {
  userCount?: number;
}

const avatars = [
  {
    name: 'Abhishkek',
    src: '/assets/pfps/t1.png',
  },
  {
    name: 'Pratik',
    src: '/assets/pfps/md2.png',
  },
  {
    name: 'Yash',
    src: '/assets/pfps/fff1.png',
  },
];

export function HomeBanner({ userCount }: BannerProps) {
  const [isLessThan768px] = useMediaQuery('(max-width: 768px)');

  const { data: session, status } = useSession();
  const posthog = usePostHog();

  if (!session && status === 'unauthenticated') {
    return (
      <Box
        pos="relative"
        w={'100%'}
        h={isLessThan768px ? '260' : '280'}
        maxH={'500px'}
        mx={'auto'}
        my={3}
        p={{ base: '5', md: '10' }}
        rounded={'md'}
      >
        <Image
          src={isLessThan768px ? MobileBanner : DesktopBanner}
          alt="Illustration — Two people working on laptops outdoors at night, surrounded by a mystical mountainous landscape illuminated by the moonlight"
          layout="fill"
          objectFit="cover"
          quality={95}
          priority
          loading="eager"
          sizes={isLessThan768px ? '100vw' : '70vw'}
          style={{
            width: '100%',
            maxWidth: '100%',
            borderRadius: 'var(--chakra-radii-md)',
          }}
        />
        <Text
          pos="relative"
          zIndex={1}
          color="white"
          fontSize={isLessThan768px ? '2xl' : '28px'}
          fontWeight={'700'}
          lineHeight={'120%'}
        >
          Find Your Next High
          <br /> Paying Crypto Gig
        </Text>
        <Text
          pos="relative"
          zIndex={1}
          maxW={{ base: '100%', md: '30rem' }}
          mt={isLessThan768px ? '2.5' : '4'}
          color={'white'}
          fontSize={{ base: '13px', md: 'lg' }}
          lineHeight={'130%'}
        >
          Participate in bounties or apply to freelance gigs of world-class
          crypto companies, all with a single profile.
        </Text>
        <Flex
          zIndex={1}
          align={'center'}
          direction={isLessThan768px ? 'column' : 'row'}
          gap={isLessThan768px ? '3' : '4'}
          mt={'4'}
        >
          <AuthWrapper style={{ w: isLessThan768px ? '100%' : 'auto' }}>
            <Button
              className="ph-no-capture"
              w={isLessThan768px ? '100%' : 'auto'}
              px={'2.25rem'}
              py={'0.75rem'}
              color={'#3223A0'}
              fontSize={'0.875rem'}
              bg={'white'}
              onClick={() => {
                posthog.capture('signup_banner');
              }}
            >
              Sign Up
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
            {userCount !== null && (
              <Text
                pos="relative"
                ml={'0.6875rem'}
                color="brand.slate.200"
                fontSize={{ base: '0.8rem', md: '0.875rem' }}
              >
                Join {userCount?.toLocaleString()}+ others
              </Text>
            )}
          </Flex>
        </Flex>
      </Box>
    );
  }

  return null;
}
