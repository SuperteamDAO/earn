import { Box, Flex, Image, Text } from '@chakra-ui/react';
import React from 'react';

import SponsorButton from '@/components/ProfileSetup/SponsorButton';
import TalentButton from '@/components/ProfileSetup/TalentButton';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';

const Index = () => {
  return (
    <Default
      meta={
        <Meta
          title="Superteam Earn"
          description="Every Solana opportunity in one place!"
          canonical="https://earn.superteam.fun/new/"
        />
      }
    >
      <Box
        pos={'relative'}
        justifyContent={'center'}
        display={'flex'}
        h={'100vh'}
        fontFamily="Inter"
      >
        <Box
          pos={'absolute'}
          display={{ base: 'none', md: 'block' }}
          w={'full'}
          h={'20rem'}
          bgImage={`url(/assets/bg/newbanner.svg)`}
        ></Box>
        <Flex
          pos={'relative'}
          align={'center'}
          justify={{ base: 'start', lg: 'center' }}
          direction={{ base: 'column', lg: 'row' }}
          gap={{ base: '3rem', lg: '6rem' }}
          px={{ base: 4, lg: 0 }}
          py={{ base: 6, lg: 0 }}
        >
          <Flex
            direction={'column'}
            w={{ base: 'full', lg: '24rem' }}
            bg={'white'}
            borderRadius={'7px'}
            shadow={'0px 4px 11px rgba(0, 0, 0, 0.08)'}
          >
            <Box
              alignItems={'center'}
              justifyContent={'center'}
              display={'flex'}
              w={'full'}
              py={16}
              bg={'rgba(101, 98, 255, 0.12)'}
            >
              <Image
                h={14}
                alt={'suitcase icon'}
                src={'/assets/icons/suitcase.svg'}
              />
            </Box>
            <Box p={4}>
              <Text color={'black'} fontSize={'1rem'} fontWeight={600}>
                Looking for Talent?
              </Text>
              <Text
                color={'brand.slate.500'}
                fontSize={'0.9rem'}
                fontWeight={400}
              >
                List a bounty, or grant for your project and find your next
                contributor..
              </Text>
              <Box flexDir={'column'} gap={5} display={'flex'} my={6}>
                <Flex align={'center'} gap={2}>
                  <Image
                    w={4}
                    alt={'tick'}
                    src={'/assets/icons/purple-tick.svg'}
                  />
                  <Text
                    color={'brand.slate.500'}
                    fontSize={'0.9rem'}
                    fontWeight={400}
                  >
                    Get in front of 1,000+ weekly visitors
                  </Text>
                </Flex>
                <Flex align={'center'} justify={'start'} gap={2}>
                  <Box w={5}>
                    <Image
                      w={4}
                      alt={'tick'}
                      src={'/assets/icons/purple-tick.svg'}
                    />
                  </Box>
                  <Text
                    color={'brand.slate.500'}
                    fontSize={'0.9rem'}
                    fontWeight={400}
                  >
                    Instant listing creation through templates
                  </Text>
                </Flex>
                <Flex align={'center'} gap={2}>
                  <Image
                    w={4}
                    alt={'tick'}
                    src={'/assets/icons/purple-tick.svg'}
                  />
                  <Text
                    color={'brand.slate.500'}
                    fontSize={'0.9rem'}
                    fontWeight={400}
                  >
                    100% free
                  </Text>
                </Flex>
              </Box>
              <SponsorButton />
            </Box>
          </Flex>

          <Flex
            direction={'column'}
            w={{ base: 'full', lg: '24rem' }}
            bg={'white'}
            borderRadius={'7px'}
            shadow={'0px 4px 11px rgba(0, 0, 0, 0.08)'}
          >
            <Box
              alignItems={'center'}
              justifyContent={'center'}
              display={'flex'}
              w={'full'}
              py={16}
              bg={
                'radial-gradient(50% 50% at 50% 50%, rgba(101, 98, 255, 0.12) 0%, rgba(98, 255, 246, 0.12) 100%)'
              }
            >
              <Image
                h={14}
                alt={'user icon'}
                src={'/assets/icons/userIcon.svg'}
              />
            </Box>
            <Box p={4}>
              <Text color={'black'} fontSize={'1rem'} fontWeight={600}>
                Looking to Earn?
              </Text>
              <Text
                color={'brand.slate.500'}
                fontSize={'0.9rem'}
                fontWeight={400}
              >
                Create a profile to get notified when new earning opportunities
                get posted.
              </Text>
              <Box flexDir={'column'} gap={5} display={'flex'} my={6}>
                <Flex align={'center'} gap={2}>
                  <Image
                    w={4}
                    alt={'tick'}
                    src={'/assets/icons/purple-tick.svg'}
                  />
                  <Text
                    color={'brand.slate.500'}
                    fontSize={'0.9rem'}
                    fontWeight={400}
                  >
                    Start contributing to top Solana projects
                  </Text>
                </Flex>
                <Flex align={'center'} gap={2}>
                  <Image
                    w={4}
                    alt={'tick'}
                    src={'/assets/icons/purple-tick.svg'}
                  />
                  <Text
                    color={'brand.slate.500'}
                    fontSize={'0.9rem'}
                    fontWeight={400}
                  >
                    Build your on-chain resume
                  </Text>
                </Flex>
                <Flex align={'center'} gap={2}>
                  <Image
                    w={4}
                    alt={'tick'}
                    src={'/assets/icons/purple-tick.svg'}
                  />
                  <Text
                    color={'brand.slate.500'}
                    fontSize={'0.9rem'}
                    fontWeight={400}
                  >
                    Get paid in crypto
                  </Text>
                </Flex>
              </Box>
              <TalentButton />
            </Box>
          </Flex>
        </Flex>
      </Box>
    </Default>
  );
};

export default Index;
