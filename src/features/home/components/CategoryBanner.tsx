import { Box, Button, Text, useMediaQuery, VStack } from '@chakra-ui/react';
import NextImage from 'next/image';
import { usePostHog } from 'posthog-js/react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AuthWrapper } from '@/features/auth';
import { useUser } from '@/store/user';

const bannerPrefix = '/assets/category_assets/banners/';

type CategoryTypes = 'content' | 'development' | 'design' | 'other';

type CategoryBanner = {
  type: CategoryTypes;
  img: string;
  headingKey: string;
  descriptionKey: string;
};

const banners: CategoryBanner[] = [
  {
    type: 'content',
    img: bannerPrefix + 'Content.webp',
    headingKey: 'CategoryBanner.content.heading',
    descriptionKey: 'CategoryBanner.content.description',
  },
  {
    type: 'development',
    img: bannerPrefix + 'Dev.webp',
    headingKey: 'CategoryBanner.development.heading',
    descriptionKey: 'CategoryBanner.development.description',
  },
  {
    type: 'design',
    img: bannerPrefix + 'Design.webp',
    headingKey: 'CategoryBanner.design.heading',
    descriptionKey: 'CategoryBanner.design.description',
  },
  {
    type: 'other',
    img: bannerPrefix + 'Other.webp',
    headingKey: 'CategoryBanner.other.heading',
    descriptionKey: 'CategoryBanner.other.description',
  },
];

export function CategoryBanner({ category }: { category: CategoryTypes }) {
  const [isLessThan768px] = useMediaQuery('(max-width: 768px)');
  const [banner, setBanner] = useState<CategoryBanner | null>(null);
  const posthog = usePostHog();
  const { user } = useUser();
  const { t } = useTranslation('common');

  useEffect(() => {
    setBanner(banners.find((b) => b.type === category) ?? null);
  }, []);

  return (
    !!banner && (
      <VStack pos="relative" w="full" h="18rem">
        <NextImage
          src={banner.img}
          alt={t(`CategoryBanner.${banner.type}.imageAlt`)}
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
          maxW={'7xl'}
          px={{ base: 3, md: 4 }}
          transform="translateY(-50%)"
        >
          {banner.headingKey && (
            <Text
              color="white"
              fontSize={{ base: '2xl', md: '4xl' }}
              fontWeight="bold"
            >
              {t(banner.headingKey)}
            </Text>
          )}
          {banner.descriptionKey && (
            <Text
              maxW="37rem"
              color="white"
              fontSize={{ base: 'sm', md: 'lg' }}
              fontWeight="medium"
            >
              {t(banner.descriptionKey)}
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
                {t('CategoryBanner.signUpButton')}
              </Button>
            </AuthWrapper>
          )}
        </VStack>
      </VStack>
    )
  );
}
