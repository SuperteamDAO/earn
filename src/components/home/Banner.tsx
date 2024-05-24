import {
  Avatar,
  AvatarGroup,
  Box,
  Button,
  Flex,
  Skeleton,
  Text,
  useMediaQuery,
} from '@chakra-ui/react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import React from 'react';

import { AuthWrapper } from '@/features/auth';
import DesktopBanner from '@/public/assets/home/display/banner.png';
import MobileBanner from '@/public/assets/home/display/banner-mobile.png';

interface BannerProps {
  userCount?: number;
}

const avatars = [
  {
    name: 'Anoushk',
    src: 'https://res.cloudinary.com/dgvnuwspr/image/upload/c_scale,w_30,h_30,f_auto/v1683132586/People%20DPs/recA3Sa7t1loYvDHo.jpg',
  },
  {
    name: 'Ujjwal',
    src: 'https://res.cloudinary.com/dgvnuwspr/image/upload/c_scale,w_30,h_30,f_auto/v1683135404/People%20DPs/rec4XUFtbh6upVYpA.jpg',
  },
  {
    name: 'Yash',
    src: 'https://res.cloudinary.com/dgvnuwspr/image/upload/c_scale,w_30,h_30,f_auto/v1683135395/People%20DPs/recb4gDjdKoFDAyo7.png',
  },
];

export function HomeBanner({ userCount }: BannerProps) {
  const [isLessThan768px] = useMediaQuery('(max-width: 768px)');

  const { data: session, status } = useSession();

  if (!session && status === 'loading') {
    return (
      <Skeleton
        h={isLessThan768px ? '400' : '280'}
        maxH="500px"
        mx={'auto'}
        mb={8}
        p={{ base: '6', md: '10' }}
        rounded={'md'}
      />
    );
  }

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
          quality={90}
          priority={true}
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
          Unlock your crypto
          <br /> earning potential
        </Text>
        <Text
          pos="relative"
          zIndex={1}
          maxW={{ base: '100%', md: '460px' }}
          mt={isLessThan768px ? '2.5' : '4'}
          color={'white'}
          fontSize={{ base: '13px', md: 'lg' }}
        >
          Explore bounties, projects, and grant opportunities for developers and
          non-technical talent alike
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
              w={isLessThan768px ? '100%' : 'auto'}
              px={'2.25rem'}
              py={'0.75rem'}
              color={'#3223A0'}
              fontSize={'0.875rem'}
              bg={'white'}
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
