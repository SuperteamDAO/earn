import { Box, Button, Flex, Image, SimpleGrid, Text } from '@chakra-ui/react';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import Countdown from 'react-countdown';

import { CountDownRenderer } from '@/components/shared/countdownRenderer';
import { tokenList } from '@/constants';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';
import ScribesLogo from '@/svg/scribes-logo';

interface TrackProps {
  title: string;
  sponsor: {
    name: string;
    logo: string;
  };
  token: string;
  rewardAmount: number;
}

interface Stats {
  totalRewardAmount: number;
  totalListings: number;
}

export default function Scribes() {
  const [trackData, setTrackData] = useState<TrackProps[]>();
  const [stats, setStats] = useState<Stats>();
  useEffect(() => {
    const getTracks = async () => {
      const trackData = await axios.get('/api/hackathon/', {
        params: {
          slug: 'scribes',
        },
      });
      setTrackData(trackData.data);
    };

    const getStats = async () => {
      const statsData = await axios.get('/api/hackathon/stats/', {
        params: {
          slug: 'scribes',
        },
      });
      setStats(statsData.data);
    };

    getTracks();
    getStats();
  }, []);
  const TrackBox = ({ title, sponsor, token, rewardAmount }: TrackProps) => {
    return (
      <Box
        p={4}
        borderWidth={'1px'}
        borderColor="brand.slate.200"
        borderRadius={8}
      >
        <Flex align="center" gap={3}>
          <Image
            w={14}
            h={14}
            borderRadius={3}
            objectFit={'cover'}
            alt={sponsor.name}
            src={sponsor.logo}
          />
          <Flex direction={'column'}>
            <Text color={'brand.slate.900'} fontSize="lg" fontWeight={600}>
              {title}
            </Text>
            <Text color={'brand.slate.500'} fontSize="md" fontWeight={500}>
              {sponsor.name}
            </Text>
          </Flex>
        </Flex>
        <Flex justify={'end'} gap={1}>
          <Image
            w={6}
            h={6}
            alt={token}
            rounded={'full'}
            src={tokenList.find((t) => t.tokenSymbol === token)?.icon || ''}
          />
          <Text color={'brand.slate.700'} fontWeight={600}>
            {rewardAmount?.toLocaleString()}
          </Text>
          <Text color={'brand.slate.400'} fontWeight={600}>
            {token}
          </Text>
        </Flex>
      </Box>
    );
  };

  return (
    <Default
      className="bg-white"
      meta={
        <Meta
          title="Solana Scribes | Superteam Earn"
          description="Explore the latest bounties on Superteam Earn, offering opportunities in the crypto space across Design, Development, and Content."
          canonical="https://earn.superteam.fun"
        />
      }
    >
      <Box>
        <Flex
          pos={{ base: 'unset', md: 'relative' }}
          align="center"
          justify="center"
          direction={{ base: 'column', md: 'row' }}
          w="100%"
          h={{ base: 'auto', md: 'full' }}
          minH={{ base: 'fit-content', md: '300px' }}
          py={8}
          bgGradient="radial-gradient(ellipse farthest-corner at 0 140%, #ffe6d2 10%, #ffe2c9 80%)"
        >
          <Flex justify={'end'} w="100%" maxW="7xl">
            <Image alt="solana scribes" src="/assets/scribes3.png" />
          </Flex>
          <Box
            pos={{ base: 'unset', md: 'absolute' }}
            right={{ base: 3, md: 6 }}
            left={{ base: 3, md: 6 }}
            w={{ base: '96vw', md: 'auto' }}
            maxW="7xl"
            mx="auto"
            mt={{ base: 8, md: 'auto' }}
          >
            <ScribesLogo />
            <Text
              w={{ base: '100%', md: '40%' }}
              pt={4}
              color="#4D2300"
              fontSize={'lg'}
            >
              Participate in Solana&apos;s first ever content hackathon
            </Text>
            <Flex
              align={{ base: 'start', md: 'center' }}
              direction={{ base: 'column', md: 'row' }}
              gap={{ base: 2, md: 8 }}
              py={4}
            >
              <Button
                onClick={() =>
                  window.open(
                    'https://airtable.com/app3nkVnBCUqJGHay/shrCqEUm74icXCBi0',
                    '_blank',
                  )
                }
                rounded="full"
              >
                Sponsor A Track
              </Button>
            </Flex>
            <Flex gap={6} pt={6}>
              <Flex direction={'column'}>
                <Text>Total Prizes</Text>
                <Text
                  color={'brand.slate.800'}
                  fontSize={'2xl'}
                  fontWeight={600}
                >
                  ${stats?.totalRewardAmount.toLocaleString()}
                </Text>
              </Flex>
              <Flex direction={'column'}>
                <Text>Tracks</Text>
                <Text
                  color={'brand.slate.800'}
                  fontSize={'2xl'}
                  fontWeight={600}
                >
                  {stats?.totalListings}
                </Text>
              </Flex>
              <Flex direction={'column'}>
                <Text>Submissions Open in</Text>
                <Text
                  color={'brand.slate.800'}
                  fontSize={'2xl'}
                  fontWeight={600}
                >
                  <Countdown
                    // date={endingTime}
                    date={new Date('2024-02-19T23:59:59')}
                    renderer={CountDownRenderer}
                    zeroPadDays={1}
                  />
                </Text>
              </Flex>
            </Flex>
          </Box>
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
                  />
                ))}
            </SimpleGrid>
          </Box>
        </Box>
      </Box>
    </Default>
  );
}
