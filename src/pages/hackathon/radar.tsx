import { Box, Button, Circle, Flex, SimpleGrid, Text } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import React from 'react';
import Countdown from 'react-countdown';

import { TrackBox } from '@/components/hackathon/TrackBox';
import { CountDownRenderer } from '@/components/shared/countdownRenderer';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';
import { useStatsData, useTrackData } from '@/queries/hackathon';
import { RadarLogo } from '@/svg/radar-logo';

const MotionBox = motion(Box);
const MotionFlex = motion(Flex);
const MotionText = motion(Text);
const MotionButton = motion(Button);

export default function Radar() {
  const slug = 'radar';

  const { data: trackData, isLoading: isTracksLoading } = useTrackData(slug);
  const { data: stats, isLoading: isStatsLoading } = useStatsData(slug);

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
      <MotionBox
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
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
          <MotionFlex
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <RadarLogo styles={{ height: '5.5rem', width: 'auto' }} />
          </MotionFlex>
          <MotionText
            mt={1}
            px={6}
            color="#AAA199"
            fontSize={'lg'}
            textAlign={'center'}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 0.9 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            maxW="28rem"
          >
            Submit to side tracks of the latest Solana Global Hackathon
          </MotionText>
          <Flex align="center" gap={6}>
            <MotionButton
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
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Sponsor a Track
            </MotionButton>
            <MotionFlex
              align="center"
              gap={1}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <Circle bg="green.500" size={2.5} />
              <Text color={'gray.100'} fontSize={'sm'} fontWeight={500}>
                Submissions Open
              </Text>
            </MotionFlex>
          </Flex>
          <MotionFlex
            justify="center"
            gap={{ base: 4, md: 12 }}
            px={6}
            pt={4}
            pb={12}
            color="gray.100"
            visibility={isStatsLoading ? 'hidden' : 'visible'}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
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
          </MotionFlex>
        </Flex>
        <Box mx={6}>
          <Box maxW="7xl" mx="auto" py={6}>
            <MotionText
              mb={4}
              color={'brand.slate.900'}
              fontSize={'xl'}
              fontWeight={600}
              visibility={isTracksLoading ? 'hidden' : 'visible'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 1 }}
            >
              Submission Tracks
            </MotionText>
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
      </MotionBox>
    </Default>
  );
}
