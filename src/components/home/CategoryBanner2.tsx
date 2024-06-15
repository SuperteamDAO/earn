import { Box, Button, Text, useMediaQuery, VStack } from '@chakra-ui/react';
import NextImage from 'next/image';
import { usePostHog } from 'posthog-js/react';
import { useEffect, useState } from 'react';

import { AuthWrapper } from '@/features/auth';
import { userStore } from '@/store/user';

const bannerPrefix = '/assets/category_assets/banners/';

type CategoryTypes = 'content' | 'development' | 'design' | 'other';

type CategoryBanner = {
  type: CategoryTypes;
  img: string;
  heading: string;
  description: string;
};
const banners: CategoryBanner[] = [
  {
    type: 'content',
    img: bannerPrefix + 'Content.png',
    heading: 'Find your next Content Gig',
    description:
      'If delighting users with eye-catching designs is your jam, you should check out the earning opportunities below.',
  },
  {
    type: 'development',
    img: bannerPrefix + 'Dev.png',
    heading: 'Find your next Development Gig',
    description:
      'If delighting users with eye-catching designs is your jam, you should check out the earning opportunities below.',
  },
  {
    type: 'design',
    img: bannerPrefix + 'Design.png',
    heading: 'Find your next Design Gig',
    description:
      'If delighting users with eye-catching designs is your jam, you should check out the earning opportunities below.',
  },
  {
    type: 'other',
    img: bannerPrefix + 'Other.png',
    heading: 'Find your next Other Gig',
    description:
      'If delighting users with eye-catching designs is your jam, you should check out the earning opportunities below.',
  },
];

export function CategoryBanner2({ category }: { category: CategoryTypes }) {
  const [isLessThan768px] = useMediaQuery('(max-width: 768px)');
  const [banner, setBanner] = useState<CategoryBanner | null>(null);
  const posthog = usePostHog();
  const { userInfo } = userStore();

  useEffect(() => {
    setBanner(banners.find((b) => b.type === category) ?? null);
  }, []);

  return (
    !!banner && (
      <VStack pos="relative" w="full" h="18rem">
        <NextImage
          src={banner.img}
          alt={banner.type}
          width={1440}
          height={290}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
          }}
        />
        <Box
          pos="absolute"
          top={0}
          left={0}
          display="block"
          w="full"
          h="full"
          bg="rgba(0,0,0,0.5)"
        />
        <VStack
          pos="absolute"
          top="50%"
          align="start"
          w="full"
          maxW={'8xl'}
          px={{ base: 3, md: 4 }}
          transform="translateY(-50%)"
        >
          {banner.heading && (
            <Text color="white" fontSize={'4xl'} fontWeight="bold">
              {banner.heading}
            </Text>
          )}
          {banner.description && (
            <Text
              maxW="31rem"
              color="white"
              fontSize={'lg'}
              fontWeight="medium"
            >
              {banner.description}
            </Text>
          )}
          {!userInfo && (
            <AuthWrapper style={{ w: isLessThan768px ? '100%' : 'auto' }}>
              <Button
                className="ph-no-capture"
                w={isLessThan768px ? '100%' : 'auto'}
                my={2}
                px={'2.25rem'}
                py={'0.75rem'}
                color={'#3223A0'}
                fontSize={'0.875rem'}
                bg={'white'}
                onClick={() => {
                  posthog.capture('signup_category banner');
                }}
              >
                Sign Up
              </Button>
            </AuthWrapper>
          )}
        </VStack>
      </VStack>
    )
  );
}
