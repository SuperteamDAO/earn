import {
  Box,
  Center,
  Divider,
  Flex,
  HStack,
  Text,
  VStack,
} from '@chakra-ui/react';

import ISC from '@/public/assets/landingsponsor/sponsors/ISC.png';
import Parcl from '@/public/assets/landingsponsor/sponsors/parcl.png';
import Solana from '@/public/assets/landingsponsor/sponsors/solana.png';
import Tensor from '@/public/assets/landingsponsor/sponsors/tensor.png';
import ChasedBarker from '@/public/assets/landingsponsor/users/chasedBarker.png';
import Eno from '@/public/assets/landingsponsor/users/eno.png';
import EvanSolomon from '@/public/assets/landingsponsor/users/evanSolomon.png';
import TensorHQ from '@/public/assets/landingsponsor/users/tensor.png';

import { HighQualityImage } from './HighQualityImage';
import { Stars } from './Stars';
import { TestimonialCard, type TestimonialProps } from './TestimonialCard';

const testimonials: TestimonialProps[] = [
  {
    stars: 4,
    message: `I'll say it again, Earn is going to become one of the most important non-protocol products in the Solana ecosystem. Connecting developers (amongst others) to opportunity and protocols to talent.`,
    logo: Solana,
    pfp: ChasedBarker,
    name: 'Chased Barker',
    position: 'Global Developer Growth, Solana',
  },
  {
    stars: 5,
    message: `I have a 💙 affair with 
@SuperteamEarn. Our team uses it to scout crypto-native talent. 
<br />
<br />
Perfect hiring workflow: 
<br /> bounty -> trial period -> full-time offer.`,
    logo: ISC,
    pfp: Eno,
    name: 'Chased Barker',
    position: 'Co-Founder, ISC',
  },
  {
    stars: 4,
    message: `Superteam Earn is one of the most underrated and valuable platforms for both Solana protocols and 
users`,
    logo: Parcl,
    pfp: EvanSolomon,
    name: 'Evan Solomon',
    position: 'BD Lead, Parcl',
  },
];

export function Testimonials() {
  return (
    <VStack
      align="start"
      gap={8}
      w="full"
      mb="4rem"
      px={{ base: '1.875rem', lg: '7rem', xl: '11rem' }}
    >
      <Divider mb="2rem" />
      <Flex
        justify={'space-between'}
        direction={{ base: 'column', md: 'row-reverse' }}
        flex={1}
        gap={8}
        w="full"
        h="100%"
        border="1px solid"
        borderColor="brand.slate.300"
        rounded={4}
      >
        <Center
          w={{ base: '100%', md: '40%' }}
          h={{ base: '14.754rem', md: 'auto' }}
          bg="black"
          rounded={4}
        >
          <Box w={{ base: '5rem', md: '8rem' }}>
            <HighQualityImage
              src={Tensor}
              alt="Tensor HQ USer"
              style={{
                width: '100%',
                height: '100%',
              }}
            />
          </Box>
        </Center>
        <VStack align="start" gap={4} p={{ base: '1rem', md: '2.5rem' }}>
          <Stars count={5} filled={5} />
          <Text
            color="brand.slate.600"
            fontSize={{ base: '1.4rem', md: '1.87rem' }}
            lineHeight={1.1}
          >
            Superteam are chads. <br />
            Superteam Earn is awesome. <br />
            Everybody should use it 💜
          </Text>
          <HStack gap={8}>
            <VStack align="start" gap={0}>
              <Text
                color="brand.slate.800"
                fontSize={'1.9rem'}
                fontWeight={600}
              >
                520k
              </Text>
              <Text
                color="brand.slate.500"
                fontSize={{ base: '0.625rem', md: '0.925rem' }}
                fontWeight={500}
              >
                Page Views
              </Text>
            </VStack>
            <VStack align="start" gap={0}>
              <Text
                color="brand.slate.800"
                fontSize={'1.9rem'}
                fontWeight={600}
              >
                369
              </Text>
              <Text
                color="brand.slate.500"
                fontSize={{ base: '0.625rem', md: '0.925rem' }}
                fontWeight={500}
              >
                Total Submissions
              </Text>
            </VStack>
          </HStack>
          <HStack gap={6}>
            <Box
              gap={6}
              w={{ base: '2.1rem', md: '3.1rem' }}
              h={{ base: '2.1rem', md: '3.1rem' }}
            >
              <HighQualityImage
                src={TensorHQ}
                alt="TensorHQ"
                width={50}
                height={50}
                style={{ width: '100%', height: '100%' }}
              />
            </Box>
            <Text color="black" fontSize={{ base: '1rem', md: '1.5rem' }}>
              Tensor HQ, on Twitter
            </Text>
          </HStack>
        </VStack>
      </Flex>
      <Flex wrap={'wrap'} gap={8} mt="auto">
        {testimonials.map((t) => (
          <TestimonialCard key={t.name} {...t} />
        ))}
      </Flex>
    </VStack>
  );
}
