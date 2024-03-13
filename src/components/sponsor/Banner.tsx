import {
  Box,
  Divider,
  Flex,
  Image,
  Link,
  Skeleton,
  Text,
  Tooltip,
} from '@chakra-ui/react';
import axios from 'axios';
import Avatar from 'boring-avatars';
import { useEffect, useState } from 'react';
import { MdOutlineChatBubbleOutline } from 'react-icons/md';

import { userStore } from '@/store/user';

interface SponsorStats {
  name?: string;
  logo?: string;
  yearOnPlatform?: number;
  totalRewardAmount?: number;
  totalListings?: number;
  totalSubmissions?: number;
}

export function Banner({ isHackathonRoute }: { isHackathonRoute?: boolean }) {
  const { userInfo } = userStore();
  const [sponsorStats, setSponsorStats] = useState<SponsorStats>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const sponsorId = isHackathonRoute
    ? userInfo?.hackathonId
    : userInfo?.currentSponsorId;

  const tooltiptextreward = `Total amount rewarded by sponsor : $${sponsorStats?.totalRewardAmount?.toLocaleString()}`;
  const tooltiptextlistings = `Total Listing done by sponsor : ${sponsorStats?.totalListings?.toLocaleString()}`;
  const tooltiptextsubmissions = `Total Submissions by sponsor : ${sponsorStats?.totalSubmissions?.toLocaleString()}`;

  useEffect(() => {
    const getSponsorStats = async () => {
      let apiEndpoint = '/api/sponsors/stats';

      if (isHackathonRoute) {
        apiEndpoint = '/api/hackathon/stats';
      }
      const sponsorData = await axios.get(apiEndpoint);
      setSponsorStats(sponsorData.data);
      setIsLoading(false);
    };
    getSponsorStats();
  }, [sponsorId]);

  const sponsor = isHackathonRoute ? sponsorStats : userInfo?.currentSponsor;

  if (!sponsorId) return null;
  return (
    <Flex gap={4} w="100%">
      <Box
        w="100%"
        mb={6}
        px={8}
        py={6}
        color="white"
        bg="white"
        borderWidth={'1px'}
        borderColor={'brand.slate.200'}
        borderRadius="md"
      >
        <Flex align="center" gap={12}>
          <Flex align="center" gap={3}>
            {sponsor?.logo ? (
              <Image
                boxSize="52px"
                borderRadius={4}
                objectFit={'cover'}
                alt={sponsor?.name}
                src={sponsor?.logo}
              />
            ) : (
              <Avatar
                colors={['#92A1C6', '#F0AB3D', '#C271B4']}
                name={sponsor?.name}
                size={54}
                variant="marble"
              />
            )}
            <Box>
              <Text
                color={'brand.slate.900'}
                fontSize="lg"
                fontWeight={600}
                whiteSpace={'nowrap'}
              >
                {sponsor?.name}
              </Text>
              {isLoading ? (
                <Skeleton w="170px" h="20px" mt={2} />
              ) : (
                <Text
                  color={'brand.slate.500'}
                  fontWeight={400}
                  whiteSpace={'nowrap'}
                >
                  {!isHackathonRoute
                    ? `Sponsor since ${sponsorStats.yearOnPlatform}`
                    : 'Hackathon'}
                </Text>
              )}
            </Box>
          </Flex>
          <Divider
            w="2px"
            h={14}
            borderColor={'brand.slate.200'}
            orientation="vertical"
          />
          <Tooltip
            color="grey"
            bg="white"
            label={tooltiptextreward}
            placement="bottom"
          >
            <Box _hover={{ cursor: 'pointer' }}>
              <Text
                color={'brand.slate.500'}
                fontSize="md"
                fontWeight={400}
                whiteSpace={'nowrap'}
              >
                {!isHackathonRoute ? 'Rewarded' : 'Total Prizes'}
              </Text>
              {isLoading ? (
                <Skeleton w="72px" h="20px" mt={2} />
              ) : (
                <Text color={'brand.slate.900'} fontSize="lg" fontWeight={600}>
                  ${sponsorStats?.totalRewardAmount?.toLocaleString()}
                </Text>
              )}
            </Box>
          </Tooltip>
          <Tooltip
            color="grey"
            bg="white"
            label={tooltiptextlistings}
            placement="bottom"
          >
            <Box _hover={{ cursor: 'pointer' }}>
              <Text color={'brand.slate.500'} fontSize="md" fontWeight={400}>
                {!isHackathonRoute ? 'Listings' : 'Tracks'}
              </Text>
              {isLoading ? (
                <Skeleton w="32px" h="20px" mt={2} />
              ) : (
                <Text color={'brand.slate.900'} fontSize="lg" fontWeight={600}>
                  {sponsorStats?.totalListings}
                </Text>
              )}
            </Box>
          </Tooltip>
          <Tooltip
            color="grey"
            bg="white"
            label={tooltiptextsubmissions}
            placement="bottom"
          >
            <Box _hover={{ cursor: 'pointer' }}>
              <Text color={'brand.slate.500'} fontSize="md" fontWeight={400}>
                Submissions
              </Text>
              {isLoading ? (
                <Skeleton w="36px" h="20px" mt={2} />
              ) : (
                <Text color={'brand.slate.900'} fontSize="lg" fontWeight={600}>
                  {sponsorStats?.totalSubmissions}
                </Text>
              )}
            </Box>
          </Tooltip>
        </Flex>
      </Box>

      <Box
        w="60%"
        maxW="400px"
        mb={6}
        px={8}
        py={6}
        color="white"
        bg="#EEF2FF"
        borderWidth={'1px'}
        borderColor={'brand.slate.200'}
        borderRadius="md"
      >
        <Link
          _hover={{ textDecoration: 'none' }}
          href="https://t.me/pratikdholani"
          isExternal
        >
          <Flex align={'center'} justify={'space-between'}>
            <Flex align={'center'}>
              <Image
                w={'3.2rem'}
                h={14}
                mr={3}
                alt="message pratik"
                src="/assets/sponsor/pratik.png"
              />
              <Box>
                <Text
                  color="brand.slate.900"
                  fontWeight={600}
                  whiteSpace={'nowrap'}
                >
                  Stuck somewhere?
                </Text>
                <Text
                  color="brand.slate.500"
                  fontWeight={600}
                  whiteSpace={'nowrap'}
                >
                  Message Pratik
                </Text>
              </Box>
            </Flex>
            <MdOutlineChatBubbleOutline color="#1E293B" size={24} />
          </Flex>
        </Link>
      </Box>
    </Flex>
  );
}
