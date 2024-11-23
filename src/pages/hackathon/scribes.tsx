import { Box, Button, Flex, SimpleGrid, Text } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import React from 'react';
import Countdown from 'react-countdown';

import { TrackBox } from '@/components/hackathon/TrackBox';
import { CountDownRenderer } from '@/components/shared/countdownRenderer';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';
import { statsDataQuery, trackDataQuery } from '@/queries/hackathon';
import { ScribesLogo } from '@/svg/scribes-logo';

export default function Scribes() {
  const slug = 'scribes';

  const { data: trackData } = useQuery(trackDataQuery(slug));
  const { data: stats } = useQuery(statsDataQuery(slug));

  return (
    <Default
      className="bg-white"
      meta={
        <Meta
          title="Solana Scribes | Solar Earn"
          description="Explore the latest bounties on Solar Earn, offering opportunities in the crypto space across Design, Development, and Content."
          canonical=""
        />
      }
    >
      <Box>
        <Flex
          align="center"
          direction={'column'}
          pt={12}
          bgImage={"url('/assets/hackathon/scribes/scribes-bg.png')"}
          bgSize="cover"
          bgPosition="center"
          bgRepeat="no-repeat"
          borderColor={'brand.slate.200'}
          borderBottomWidth={'1px'}
        >
          <Text mb={4} fontFamily={'var(--font-mono)'}>
            Lamport DAO presents
          </Text>
          <ScribesLogo styles={{ height: '80px', width: 'auto' }} />
          <Text mt={4} px={6} color="brand.slate.600" textAlign={'center'}>
            Participate in Solana&apos;s first ever content hackathon
          </Text>
          <Flex pb={4}>
            <Button
              my={6}
              py={4}
              fontSize={'sm'}
              bg="#000"
              _hover={{ bg: '#a459ff' }}
              onClick={() =>
                window.open('https://discord.gg/solanacollective', '_blank')
              }
              rounded="full"
            >
              加入 Solana &apos; Discord
            </Button>
          </Flex>
        </Flex>
        <Flex justify="center" gap={{ base: 4, md: 12 }} px={6} py={6}>
          <Flex direction={'column'}>
            <Text fontSize={'sm'} fontWeight={500}>
              总奖金
            </Text>
            <Text
              color={'brand.slate.800'}
              fontSize={{ base: 'xl', md: '2xl' }}
              fontWeight={600}
            >
              ${stats?.totalRewardAmount.toLocaleString()}
            </Text>
          </Flex>
          <Flex direction={'column'}>
            <Text fontSize={'sm'} fontWeight={500}>
              Tracks
            </Text>
            <Text
              color={'brand.slate.800'}
              fontSize={{ base: 'xl', md: '2xl' }}
              fontWeight={600}
            >
              {stats?.totalListings}
            </Text>
          </Flex>
          <Flex direction={'column'}>
            <Text fontSize={'sm'} fontWeight={500}>
              Submissions End In
            </Text>
            <Text
              color={'brand.slate.800'}
              fontSize={{ base: 'xl', md: '2xl' }}
              fontWeight={600}
            >
              <Countdown
                date={new Date('2024-02-29T23:59:59Z')}
                renderer={CountDownRenderer}
                zeroPadDays={1}
              />
            </Text>
          </Flex>
        </Flex>
        <Box mx={6}>
          <Box maxW="7xl" mx="auto" py={6}>
            <Text
              mb={4}
              color={'brand.slate.900'}
              fontSize={'xl'}
              fontWeight={600}
            >
              Tracks
            </Text>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
              {trackData &&
                trackData.map((track, index) => (
                  <TrackBox
                    key={index}
                    title={track.title}
                    sponsor={track.sponsor}
                    token={track.token}
                    rewardAmount={track.rewardAmount}
                    slug={track.slug}
                  />
                ))}
            </SimpleGrid>
          </Box>
        </Box>
      </Box>
    </Default>
  );
}
