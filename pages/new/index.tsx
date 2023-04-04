import { Box, Button, Flex, Image, Text, VStack } from '@chakra-ui/react';
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
            position={'relative'}
            display={'flex'}
            justifyContent={'center'}
            fontFamily="Inter"
            h={'100vh'}
          >
            <Box
              position={'absolute'}
              bgImage={`url(/assets/bg/newbanner.svg)`}
              w={'full'}
              top={10}
              h={'20rem'}
            ></Box>
            <Flex
              position={'relative'}
              align={'center'}
              justify={'center'}
              gap={{ base: '3rem', lg: '6rem' }}
              flexDir={{ base: 'column', lg: 'row' }}
            >
              <Flex
                bg={'white'}
                borderRadius={'7px'}
                boxShadow={'0px 4px 11px rgba(0, 0, 0, 0.08)'}
                h={'30rem'}
                w={'24rem'}
                flexDir={'column'}
              >
                <Box
                  h={'15rem'}
                  w={'full'}
                  display={'flex'}
                  justifyContent={'center'}
                  alignItems={'center'}
                  bg={'rgba(101, 98, 255, 0.12)'}
                >
                  <Image
                    src={'/assets/icons/suitcase.svg'}
                    alt={'suitcase icon'}
                  />
                </Box>
                <Box p={4}>
                  <Text fontSize={'1rem'} color={'black'} fontWeight={600}>
                    Looking for Talent?
                  </Text>
                  <Text color={'gray.400'} fontSize={'0.9rem'} fontWeight={400}>
                    List a bounty, job, or grant for your Solana project and
                    find your next contributor..
                  </Text>
                  <Box display={'flex'} my={6} flexDir={'column'} gap={5}>
                    <Flex gap={2} alignItems={'center'}>
                      <Image
                        width={4}
                        src={'/assets/icons/purple-tick.svg'}
                        alt={'tick'}
                      />
                      <Text
                        color={'gray.400'}
                        fontSize={'0.9rem'}
                        fontWeight={400}
                      >
                        Get in front of 1,000+ weekly visitors
                      </Text>
                    </Flex>
                    <Flex gap={2} alignItems={'center'} justify={'start'}>
                      <Box w={5}>
                        <Image
                          width={4}
                          src={'/assets/icons/purple-tick.svg'}
                          alt={'tick'}
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
                    <Flex gap={2} alignItems={'center'}>
                      <Image
                        width={4}
                        src={'/assets/icons/purple-tick.svg'}
                        alt={'tick'}
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
                    fontSize={'0.9rem'}
                    w={'full'}
                    h={12}
                    color={'white'}
                    _hover={{ bg: '#6562FF' }}
                    bg={'#6562FF'}
                    onClick={() => {
                      router.push('/listings/create');
                    }}
                  >
                    List Your Opportunity
                  </Button>
                </Box>
              </Flex>

              <Flex
                bg={'white'}
                borderRadius={'7px'}
                boxShadow={'0px 4px 11px rgba(0, 0, 0, 0.08)'}
                flexDirection={'column'}
                h={'30rem'}
                w={'24rem'}
              >
                <Box
                  h={'15rem'}
                  w={'full'}
                  display={'flex'}
                  justifyContent={'center'}
                  alignItems={'center'}
                  bg={
                    'radial-gradient(50% 50% at 50% 50%, rgba(101, 98, 255, 0.12) 0%, rgba(98, 255, 246, 0.12) 100%)'
                  }
                >
                  <Image src={'/assets/icons/userIcon.svg'} alt={'user icon'} />
                </Box>
                <Box p={4}>
                  <Text fontSize={'1rem'} color={'black'} fontWeight={600}>
                    Looking to Earn?
                  </Text>
                  <Text color={'gray.400'} fontSize={'0.9rem'} fontWeight={400}>
                    Create a profile to get notified when new earning
                    opportunities get posted.
                  </Text>
                  <Box display={'flex'} my={8} flexDir={'column'} gap={5}>
                    <Flex gap={2} alignItems={'center'}>
                      <Image
                        width={4}
                        src={'/assets/icons/purple-tick.svg'}
                        alt={'tick'}
                      />
                      <Text
                        color={'gray.400'}
                        fontSize={'0.9rem'}
                        fontWeight={400}
                      >
                        Start contributing to top Solana projects
                      </Text>
                    </Flex>
                    <Flex gap={2} alignItems={'center'}>
                      <Image
                        width={4}
                        src={'/assets/icons/purple-tick.svg'}
                        alt={'tick'}
                      />
                      <Text
                        color={'gray.400'}
                        fontSize={'0.9rem'}
                        fontWeight={400}
                      >
                        Build your on-chain resume
                      </Text>
                    </Flex>
                    <Flex gap={2} alignItems={'center'}>
                      <Image
                        width={4}
                        src={'/assets/icons/purple-tick.svg'}
                        alt={'tick'}
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
                    onClick={() => {
                      router.push('/new/talent');
                    }}
                    w={'full'}
                    fontSize={'0.9rem'}
                    h={12}
                    color={'white'}
                    _hover={{ bg: '#6562FF' }}
                    bg={'#6562FF'}
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
