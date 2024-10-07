import { Box, HStack, Text, VStack } from '@chakra-ui/react';

import DUST from '@/public/assets/landingsponsor/icons/DUST.png';
import USDC from '@/public/assets/landingsponsor/icons/usdc.svg';
import DE from '@/public/assets/landingsponsor/sponsors/de.webp';
import DReader from '@/public/assets/landingsponsor/sponsors/dreader.webp';
import OKX from '@/public/assets/landingsponsor/sponsors/okx.webp';
import Saros from '@/public/assets/landingsponsor/sponsors/saros.webp';

import { fontSize, maxW, padding } from '../utils';
import { ListingCard, type ListingCardProps } from './ListingCard';

const works: ListingCardProps[] = [
  {
    pfp: DReader,
    title: 'Full Stack Development',
    name: 'dReader',
    description: `dReader is looking for a full stack developer to build a feature that allows creators to publish their comics, analyse stats and engage with their community. `,
    skills: ['frontend', 'backend'],
    submissionCount: 114,
    type: 'development',
    amount: '$1,000',
    tokenIcon: USDC,
    token: '',
  },
  {
    pfp: OKX,
    title: 'OKX Super Season Thread Bounty',
    name: 'OKX',
    description: `In celebration of the Solana Super Season, OKX is calling all crypto enthusiasts to dive into the details of this campaign on OKX Web3 Wallet, and share their insights in a captivating Twitter thread.`,
    skills: ['writing', 'marketing', 'community'],
    submissionCount: 116,
    type: 'content',
    amount: '$500',
    tokenIcon: USDC,
    token: '',
  },
  {
    pfp: DE,
    title: 'y00ts royalty dashboard design',
    name: 'DeLabs',
    description: `de[labs], the team behind y00ts, DeGods, and BTC DeGods, is looking for a talented designers to make the y00ts royalty dashboard`,
    skills: ['design'],
    submissionCount: 59,
    type: 'design',
    amount: '5,000',
    tokenIcon: DUST,
    token: '$DUST',
  },
  {
    pfp: Saros,
    title: 'Community Manager at Saros Finance',
    name: 'Saros',
    description: `Saros, a DeFi Mobile Superapp is looking for a community manager who can help strategise community growth, and manage its community`,
    skills: ['writing', 'marketing', 'community'],
    submissionCount: 84,
    type: 'community',
    amount: '$6,000',
    tokenIcon: USDC,
    token: '',
  },
];

export function ListingWork() {
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
          Get almost any kind of work done
        </Text>
        <Box className="banner-wrapper" maxW={{ base: '100%' }}>
          <Banner />
        </Box>
      </VStack>
    </VStack>
  );
}

function Banner() {
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
                  {value.type}
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
