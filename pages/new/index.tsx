import { Box, Button, Flex, Image, Text } from '@chakra-ui/react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useRouter } from 'next/router';
import React from 'react';

import { Navbar } from '../../components/navbar/navbar';
import { ConnectWallet } from '../../layouts/connectWallet';

const Index = () => {
  const { connected } = useWallet();
  const router = useRouter();
  return (
    <>
      {!connected ? (
        <ConnectWallet />
      ) : (
        <>
          <Navbar />
          <Box
            pos={'relative'}
            justifyContent={'center'}
            display={'flex'}
            h={'100vh'}
            fontFamily="Inter"
          >
            <Box
              pos={'absolute'}
              top={10}
              w={'full'}
              h={'20rem'}
              bgImage={`url(/assets/bg/newbanner.svg)`}
            ></Box>
            <Flex
              pos={'relative'}
              align={'center'}
              justify={'center'}
              direction={{ base: 'column', lg: 'row' }}
              gap={{ base: '3rem', lg: '6rem' }}
            >
              <Flex
                direction={'column'}
                w={'24rem'}
                h={'30rem'}
                bg={'white'}
                borderRadius={'7px'}
                shadow={'0px 4px 11px rgba(0, 0, 0, 0.08)'}
              >
                <Box
                  alignItems={'center'}
                  justifyContent={'center'}
                  display={'flex'}
                  w={'full'}
                  h={'15rem'}
                  bg={'rgba(101, 98, 255, 0.12)'}
                >
                  <Image
                    alt={'suitcase icon'}
                    src={'/assets/icons/suitcase.svg'}
                  />
                </Box>
                <Box p={4}>
                  <Text color={'black'} fontSize={'1rem'} fontWeight={600}>
                    Looking for Talent?
                  </Text>
                  <Text color={'gray.400'} fontSize={'0.9rem'} fontWeight={400}>
                    List a bounty, job, or grant for your Solana project and
                    find your next contributor..
                  </Text>
                  <Box flexDir={'column'} gap={5} display={'flex'} my={6}>
                    <Flex align={'center'} gap={2}>
                      <Image
                        w={4}
                        alt={'tick'}
                        src={'/assets/icons/purple-tick.svg'}
                      />
                      <Text
                        color={'gray.400'}
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
                        color={'gray.400'}
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
                        color={'gray.400'}
                        fontSize={'0.9rem'}
                        fontWeight={400}
                      >
                        100% free
                      </Text>
                    </Flex>
                  </Box>
                  <Button
                    w={'full'}
                    h={12}
                    color={'white'}
                    fontSize={'0.9rem'}
                    bg={'#6562FF'}
                    _hover={{ bg: '#6562FF' }}
                    onClick={() => {
                      router.push('/listings/create');
                    }}
                  >
                    List Your Opportunity
                  </Button>
                </Box>
              </Flex>

              <Flex
                direction={'column'}
                w={'24rem'}
                h={'30rem'}
                bg={'white'}
                borderRadius={'7px'}
                shadow={'0px 4px 11px rgba(0, 0, 0, 0.08)'}
              >
                <Box
                  alignItems={'center'}
                  justifyContent={'center'}
                  display={'flex'}
                  w={'full'}
                  h={'15rem'}
                  bg={
                    'radial-gradient(50% 50% at 50% 50%, rgba(101, 98, 255, 0.12) 0%, rgba(98, 255, 246, 0.12) 100%)'
                  }
                >
                  <Image alt={'user icon'} src={'/assets/icons/userIcon.svg'} />
                </Box>
                <Box p={4}>
                  <Text color={'black'} fontSize={'1rem'} fontWeight={600}>
                    Looking to Earn?
                  </Text>
                  <Text color={'gray.400'} fontSize={'0.9rem'} fontWeight={400}>
                    Create a profile to get notified when new earning
                    opportunities get posted.
                  </Text>
                  <Box flexDir={'column'} gap={5} display={'flex'} my={8}>
                    <Flex align={'center'} gap={2}>
                      <Image
                        w={4}
                        alt={'tick'}
                        src={'/assets/icons/purple-tick.svg'}
                      />
                      <Text
                        color={'gray.400'}
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
                        color={'gray.400'}
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
                        color={'gray.400'}
                        fontSize={'0.9rem'}
                        fontWeight={400}
                      >
                        Get paid in crypto
                      </Text>
                    </Flex>
                  </Box>
                  <Button
                    w={'full'}
                    h={12}
                    color={'white'}
                    fontSize={'0.9rem'}
                    bg={'#6562FF'}
                    _hover={{ bg: '#6562FF' }}
                    onClick={() => {
                      router.push('/new/talent');
                    }}
                  >
                    Get to work
                  </Button>
                </Box>
              </Flex>
            </Flex>
          </Box>
        </>
      )}
    </>
  );
};

export default Index;
