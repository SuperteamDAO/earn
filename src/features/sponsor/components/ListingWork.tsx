import { Box, HStack, Text, VStack } from '@chakra-ui/react';
import { useTranslation } from 'next-i18next';

import DUST from '@/public/assets/landingsponsor/icons/DUST.png';
import USDC from '@/public/assets/landingsponsor/icons/usdc.svg';
import DE from '@/public/assets/landingsponsor/sponsors/de.webp';
import DReader from '@/public/assets/landingsponsor/sponsors/dreader.webp';
import OKX from '@/public/assets/landingsponsor/sponsors/okx.webp';
import Saros from '@/public/assets/landingsponsor/sponsors/saros.webp';

import { fontSize, maxW, padding } from '../utils';
import { ListingCard, type ListingCardProps } from './ListingCard';

export function ListingWork() {
  const { t } = useTranslation('common');

  return (
    <VStack pos="relative" w={{ xl: '100%' }} mt="8rem" mb="4rem" pt="4rem">
      <Box
        pos="absolute"
        top={0}
        left={0}
        w={{ base: 'full' }}
        h={{ base: '27.8rem', md: '25.8rem' }}
        bg="brand.slate.100"
      />
      <VStack
        pos="relative"
        align={{ base: 'start' }}
        gap={8}
        w="100vw"
        maxW={maxW}
        px={padding}
      >
        <Text
          pos="relative"
          w="full"
          color="brand.slate.800"
          fontSize={fontSize}
          fontWeight={600}
          textAlign="center"
        >
          {t('ListingWork.getAlmostAnyKindOfWorkDone')}
        </Text>
        <Box className="banner-wrapper" maxW={{ base: '100%' }}>
          <Banner />
        </Box>
      </VStack>
    </VStack>
  );
}

function Banner() {
  const { t } = useTranslation('common');

  const works: ListingCardProps[] = [
    {
      pfp: DReader,
      title: t('ListingWork.fullStackDevelopment'),
      name: 'dReader',
      description: t('ListingWork.dReaderDescription'),
      skills: ['frontend', 'backend'],
      submissionCount: 114,
      type: 'development',
      amount: '$1,000',
      tokenIcon: USDC,
      token: '',
    },
    {
      pfp: OKX,
      title: t('ListingWork.okxSuperSeasonThreadBounty'),
      name: 'OKX',
      description: t('ListingWork.okxDescription'),
      skills: ['writing', 'marketing', 'community'],
      submissionCount: 116,
      type: 'content',
      amount: '$500',
      tokenIcon: USDC,
      token: '',
    },
    {
      pfp: DE,
      title: t('ListingWork.y00tsRoyaltyDashboardDesign'),
      name: 'DeLabs',
      description: t('ListingWork.deLabsDescription'),
      skills: ['design'],
      submissionCount: 59,
      type: 'design',
      amount: '5,000',
      tokenIcon: DUST,
      token: '$DUST',
    },
    {
      pfp: Saros,
      title: t('ListingWork.communityManagerAtSarosFinance'),
      name: 'Saros',
      description: t('ListingWork.sarosDescription'),
      skills: ['writing', 'marketing', 'community'],
      submissionCount: 84,
      type: 'community',
      amount: '$6,000',
      tokenIcon: USDC,
      token: '',
    },
  ];
  return (
    <div className="banner-wrapper">
      <div className="wrapper">
        {[...new Array(4)].map((_, i) => (
          <HStack className="content" key={i}>
            {works.map((value) => (
              <VStack key={`${value.title}-${value.type}`} align="start">
                <Text
                  fontSize={'1.25rem'}
                  fontWeight={600}
                  textTransform={'capitalize'}
                >
                  {t(`ListingWork.${value.type}`)}
                </Text>
                <ListingCard key={value.title} {...value} />
              </VStack>
            ))}
          </HStack>
        ))}
      </div>
    </div>
  );
}
