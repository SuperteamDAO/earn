import { Box, Button, Circle, Flex, SimpleGrid, Text } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import React from 'react';
import Countdown from 'react-countdown';

import { TrackBox } from '@/components/hackathon/TrackBox';
import { CountDownRenderer } from '@/components/shared/countdownRenderer';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';
import { statsDataQuery, trackDataQuery } from '@/queries/hackathon';
import { RenaissanceLogo } from '@/svg/renaissance-logo';

export default function Renaissance() {
  const slug = 'renaissance';

  const { data: trackData } = useQuery(trackDataQuery(slug));
  const { data: stats } = useQuery(statsDataQuery(slug));

  return (
    <Default
      className="bg-white"
      meta={
        <Meta
          title="Renaissance | Solar Earn"
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
          bgImage={"url('/assets/hackathon/renaissance/bg.png')"}
          bgSize="cover"
          bgPosition="center"
          bgRepeat="no-repeat"
          borderColor={'brand.slate.200'}
          borderBottomWidth={'1px'}
        >
          <RenaissanceLogo styles={{ height: '80px', width: 'auto' }} />
          <Text mt={4} px={6} color="blackAlpha.800" textAlign={'center'}>
            Submit to side tracks of the latest Solana Global Hackathon
          </Text>
          <Flex align="center" gap={6}>
            <Button
              my={6}
              px={6}
              py={4}
              color="#000"
              fontSize={'sm'}
              bg="#A8EAFF"
              _hover={{ bg: '#716f6e', color: '#fff' }}
              onClick={() =>
                window.open(
                  'https://airtable.com/appTNIj7RXgv7Txbt/shrh4eZOkeDDFBCOH',
                  '_blank',
                )
              }
              rounded="full"
            >
              Sponsor a Track
            </Button>
            <Flex align="center" gap={1}>
              <Circle bg="gray.500" size={2.5} />
              <Text fontSize={'sm'} fontWeight={500}>
                Submissions Closed
              </Text>
            </Flex>
          </Flex>
          <Flex justify="center" gap={{ base: 4, md: 12 }} px={6} pb={6}>
            <Flex direction={'column'}>
              <Text fontSize={'sm'} fontWeight={500}>
                Total Prizes
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
                  date={new Date('2024-04-10T11:59:59Z')}
                  renderer={CountDownRenderer}
                  zeroPadDays={1}
                />
              </Text>
            </Flex>
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
