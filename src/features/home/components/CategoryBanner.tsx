import { Box, Button, Text, useMediaQuery, VStack } from '@chakra-ui/react';
import NextImage from 'next/image';
import { usePostHog } from 'posthog-js/react';
import { useEffect, useState } from 'react';

import { AuthWrapper } from '@/features/auth';
import { useUser } from '@/store/user';

const bannerPrefix = '/assets/category_assets/banners/';

type CategoryTypes = 'content' | 'development' | 'design' | 'other';

type CategoryBanner = {
  type: CategoryTypes;
  img: string;
  heading: string;
  description: string;
  color: string;
  imgPosition: string;
};
const banners: CategoryBanner[] = [
  {
    type: 'content',
    img: bannerPrefix + 'content.jpg',
    heading: '投研学霸',
    description: '探索内容创作任务',
    color: '#9945FF',
    imgPosition: 'bottom center',
  },
  {
    type: 'development',
    img: bannerPrefix + 'dev.jpg',
    heading: '技术极客',
    description: `探索开发赏金任务`,
    color: '#FF1EC0',
    imgPosition: 'top center',
  },
  {
    type: 'design',
    img: bannerPrefix + 'design.jpg',
    heading: '创意大咖',
    description: '探索艺术赏金任务',
    color: '#F5A35E',
    imgPosition: 'center,center',
  },
  {
    type: 'other',
    img: bannerPrefix + 'other.jpg',
    heading: '自由发挥',
    description: '探索其他赏金任务',
    color: '#42E3F8',
    imgPosition: 'bottom center',
  },
];

export function CategoryBanner({ category }: { category: CategoryTypes }) {
  const [isLessThan768px] = useMediaQuery('(max-width: 768px)');
  const [banner, setBanner] = useState<CategoryBanner | null>(null);
  const posthog = usePostHog();
  const { user } = useUser();

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
            objectPosition: banner.imgPosition,
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
          maxW={'7xl'}
          px={{ base: 3, md: 4 }}
          transform="translateY(-50%)"
        >
          {banner.heading && (
            <Text
              color="white"
              fontSize={{ base: '2xl', md: '4xl' }}
              fontWeight="bold"
              style={{
                textShadow: `
                  0px 0px 8px ${banner.color},
                  0px 0px 16px ${banner.color},
                  0px 0px 56px ${banner.color},
                  0px 0px 112px ${banner.color},
                  0px 0px 192px ${banner.color},
                  0px 0px 336px ${banner.color}
                `,
              }}
            >
              {banner.heading}
            </Text>
          )}
          {banner.description && (
            <Text
              maxW="37rem"
              color="white"
              fontSize={{ base: 'sm', md: 'lg' }}
              fontWeight="medium"
              style={{
                textShadow: `
                  0px 0px 8px ${banner.color},
                  0px 0px 16px ${banner.color},
                  0px 0px 56px ${banner.color},
                  0px 0px 112px ${banner.color},
                  0px 0px 192px ${banner.color},
                  0px 0px 336px ${banner.color}
                `,
              }}
            >
              {banner.description}
            </Text>
          )}
          {!user && (
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
