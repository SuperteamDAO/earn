import { Box, Button, Flex, Image, SimpleGrid, Text } from '@chakra-ui/react';
import axios from 'axios';
import NextLink from 'next/link';
import React, { useEffect, useState } from 'react';
import Countdown from 'react-countdown';

import { CountDownRenderer } from '@/components/shared/countdownRenderer';
import { tokenList } from '@/constants';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';
import ScribesLogo from '@/svg/scribes-logo';

interface TrackProps {
  title: string;
  slug: string;
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
  const TrackBox = ({
    title,
    sponsor,
    token,
    rewardAmount,
    slug,
  }: TrackProps) => {
    return (
      <Box
        as={NextLink}
        p={{ base: 3, md: 4 }}
        borderWidth={'1px'}
        borderColor="brand.slate.200"
        borderRadius={8}
        href={`/listings/hackathon/${slug}`}
      >
        <Flex align="center" gap={3}>
          <Image
            w={{ base: 12, md: 14 }}
            h={{ base: 12, md: 14 }}
            borderRadius={3}
            objectFit={'cover'}
            alt={sponsor.name}
            src={sponsor.logo}
          />
          <Flex direction={'column'}>
            <Text
              color={'brand.slate.900'}
              fontSize={{ base: 'md', md: 'lg' }}
              fontWeight={600}
            >
              {title}
            </Text>
            <Text
              color={'brand.slate.500'}
              fontSize={{ base: 'sm', md: 'md' }}
              fontWeight={500}
            >
              {sponsor.name}
            </Text>
          </Flex>
        </Flex>
        <Flex align="center" justify={'end'} gap={1}>
          <Image
            w={{ base: 4, md: 6 }}
            h={{ base: 4, md: 6 }}
            alt={token}
            rounded={'full'}
            src={tokenList.find((t) => t.tokenSymbol === token)?.icon || ''}
          />
          <Text
            color={'brand.slate.700'}
            fontSize={{ base: 'sm', md: 'md' }}
            fontWeight={600}
          >
            {rewardAmount?.toLocaleString()}
          </Text>
          <Text
            color={'brand.slate.400'}
            fontSize={{ base: 'sm', md: 'md' }}
            fontWeight={600}
          >
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
          align="center"
          direction={'column'}
          pt={12}
          bgImage={"url('/assets/scribes-bg.png')"}
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
              Join LamportDAO&apos;s Discord
            </Button>
          </Flex>
        </Flex>
        <Flex justify="center" gap={{ base: 4, md: 12 }} px={6} py={6}>
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
              Submissions Open in
            </Text>
            <Text
              color={'brand.slate.800'}
              fontSize={{ base: 'xl', md: '2xl' }}
              fontWeight={600}
            >
              <Countdown
                // date={endingTime}
                date={new Date('2024-02-19T00:00:00')}
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
