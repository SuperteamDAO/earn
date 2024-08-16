import { Box, Button, Circle, Flex, SimpleGrid, Text } from '@chakra-ui/react';
import React from 'react';
import Countdown from 'react-countdown';

import { TrackBox } from '@/components/hackathon/TrackBox';
import { CountDownRenderer } from '@/components/shared/countdownRenderer';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';
import { useStatsData, useTrackData } from '@/queries/hackathon';
import { RadarLogo } from '@/svg/radar-logo';

export default function Radar() {
  const slug = 'renaissance';

  const { data: trackData } = useTrackData(slug);
  const { data: stats } = useStatsData(slug);

  return (
    <Default
      className="bg-white"
      meta={
        <Meta
          title="Radar | Superteam Earn"
          description="Explore the latest bounties on Superteam Earn, offering opportunities in the crypto space across Design, Development, and Content."
          canonical="https://earn.superteam.fun"
        />
      }
    >
      <Box>
        <Flex
          align="center"
          direction={'column'}
          pt={12}
          bgImage={"url('/assets/hackathon/radar/bg.webp')"}
          bgSize="cover"
          bgPosition="center"
          bgRepeat="no-repeat"
          borderColor={'brand.slate.200'}
          borderBottomWidth={'1px'}
        >
          <RadarLogo styles={{ height: '5.5rem', width: 'auto' }} />
          <Text
            mt={4}
            px={6}
            color="orange.100"
            fontSize={'lg'}
            textAlign={'center'}
            opacity={0.9}
          >
            Submit to side tracks of the latest Solana Global Hackathon
          </Text>
          <Flex align="center" gap={6}>
            <Button
              my={6}
              px={6}
              py={4}
              color="#000"
              fontSize={'sm'}
              bg="#E6B22D"
              _hover={{ bg: 'yellow.600', color: '#fff' }}
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
              <Circle bg="green.500" size={2.5} />
              <Text color={'gray.100'} fontSize={'sm'} fontWeight={500}>
                Submissions Open
              </Text>
            </Flex>
          </Flex>
          <Flex
            justify="center"
            gap={{ base: 4, md: 12 }}
            px={6}
            pb={6}
            color="gray.100"
          >
            <Flex direction={'column'}>
              <Text color="orange.100" fontSize={'sm'} fontWeight={500}>
                Total Prizes
              </Text>
              <Text fontSize={{ base: 'xl', md: '2xl' }} fontWeight={600}>
                ${stats?.totalRewardAmount.toLocaleString()}
              </Text>
            </Flex>
            <Flex direction={'column'}>
              <Text color="orange.100" fontSize={'sm'} fontWeight={500}>
                Tracks
              </Text>
              <Text fontSize={{ base: 'xl', md: '2xl' }} fontWeight={600}>
                {stats?.totalListings}
              </Text>
            </Flex>
            <Flex direction={'column'}>
              <Text color="orange.100" fontSize={'sm'} fontWeight={500}>
                Submissions Start In
              </Text>
              <Text fontSize={{ base: 'xl', md: '2xl' }} fontWeight={600}>
                <Countdown
                  date={new Date('2024-09-02T00:00:00Z')}
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
              Submission Tracks
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
