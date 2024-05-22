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
import NextLink from 'next/link';
import { useEffect, useState } from 'react';
import { AiOutlineEdit } from 'react-icons/ai';
import { MdInfoOutline, MdOutlineChatBubbleOutline } from 'react-icons/md';

import { EarnAvatar } from '@/components/shared/EarnAvatar';
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

  const tooltipTextReward = `Total compensation (in USD) of listings where the winners have been announced`;
  const tooltipTextListings = `Total number of listings added to Earn`;
  const tooltipTextSubmissions = `Total number of submissions/applications received on all listings`;

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
            <EarnAvatar
              size="52px"
              id={sponsor?.name}
              avatar={sponsor?.logo}
              borderRadius="6"
            />
            <Box>
              <Box alignItems={'center'} flexDir={'row'} display={'flex'}>
                <Text
                  color={'brand.slate.900'}
                  fontSize="lg"
                  fontWeight={600}
                  whiteSpace={'nowrap'}
                >
                  {sponsor?.name}
                </Text>
                <Link
                  as={NextLink}
                  ml={2}
                  color="brand.slate.500"
                  _hover={{
                    color: 'brand.slate.800',
                  }}
                  href={`/sponsor/edit`}
                >
                  <AiOutlineEdit size={18} color="#94a3b8" />
                </Link>
              </Box>
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
            label={tooltipTextReward}
            placement="bottom"
          >
            <Box _hover={{ cursor: 'pointer' }}>
              <Flex align="center">
                <Text
                  mr={0.5}
                  color={'brand.slate.500'}
                  fontSize="md"
                  fontWeight={400}
                  whiteSpace={'nowrap'}
                >
                  {!isHackathonRoute ? 'Rewarded' : 'Total Prizes'}
                </Text>
                <MdInfoOutline color="#94a3b8" size={16} />
              </Flex>
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
            label={tooltipTextListings}
            placement="bottom"
          >
            <Box _hover={{ cursor: 'pointer' }}>
              <Flex align="center">
                <Text
                  mr={0.5}
                  color={'brand.slate.500'}
                  fontSize="md"
                  fontWeight={400}
                  whiteSpace={'nowrap'}
                >
                  {!isHackathonRoute ? 'Listings' : 'Tracks'}
                </Text>
                <MdInfoOutline color="#94a3b8" size={16} />
              </Flex>
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
            label={tooltipTextSubmissions}
            placement="bottom"
          >
            <Box _hover={{ cursor: 'pointer' }}>
              <Flex align="center">
                <Text
                  mr={0.5}
                  color={'brand.slate.500'}
                  fontSize="md"
                  fontWeight={400}
                  whiteSpace={'nowrap'}
                >
                  Submissions
                </Text>
                <MdInfoOutline color="#94a3b8" size={16} />
              </Flex>
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
