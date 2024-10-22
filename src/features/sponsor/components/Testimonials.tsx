import {
  Box,
  Center,
  Divider,
  Flex,
  HStack,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useTranslation } from 'next-i18next';

import ISC from '@/public/assets/landingsponsor/sponsors/ISC.webp';
import Parcl from '@/public/assets/landingsponsor/sponsors/parcl.webp';
import Solana from '@/public/assets/landingsponsor/sponsors/solana.webp';
import Tensor from '@/public/assets/landingsponsor/sponsors/tensor.webp';
import ChasedBarker from '@/public/assets/landingsponsor/users/chasedBarker.webp';
import Eno from '@/public/assets/landingsponsor/users/eno.webp';
import EvanSolomon from '@/public/assets/landingsponsor/users/evanSolomon.webp';
import TensorHQ from '@/public/assets/landingsponsor/users/tensor.webp';

import { maxW, padding } from '../utils';
import { HighQualityImage } from './HighQualityImage';
import { Stars } from './Stars';
import { TestimonialCard, type TestimonialProps } from './TestimonialCard';

export function Testimonials() {
  const { t } = useTranslation('common');

  const testimonials: TestimonialProps[] = [
    {
      stars: 5,
      message: t('testimonials.chaseBarker.message'),
      logo: Solana,
      pfp: ChasedBarker,
      name: t('testimonials.chaseBarker.name'),
      position: t('testimonials.chaseBarker.position'),
    },
    {
      stars: 5,
      message: t('testimonials.enoSim.message'),
      logo: ISC,
      pfp: Eno,
      name: t('testimonials.enoSim.name'),
      position: t('testimonials.enoSim.position'),
    },
    {
      stars: 4,
      message: t('testimonials.evanSolomon.message'),
      logo: Parcl,
      pfp: EvanSolomon,
      name: t('testimonials.evanSolomon.name'),
      position: t('testimonials.evanSolomon.position'),
    },
  ];

  return (
    <VStack
      align="start"
      gap={8}
      w="full"
      maxW={maxW}
      mb="4rem"
      px={padding}
      id="customers"
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
              alt={t('testimonials.tensorHQ.logoAlt')}
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
            {t('testimonials.tensorHQ.message')}
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
                {t('testimonials.tensorHQ.pageViews')}
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
                {t('testimonials.tensorHQ.totalSubmissions')}
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
                alt={t('testimonials.tensorHQ.userAlt')}
                width={50}
                height={50}
                style={{ width: '100%', height: '100%' }}
              />
            </Box>
            <Text color="black" fontSize={{ base: '1rem', md: '1.5rem' }}>
              {t('testimonials.tensorHQ.name')}
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
