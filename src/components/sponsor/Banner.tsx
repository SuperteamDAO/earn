import {
  Box,
  Divider,
  Flex,
  Image,
  Link,
  Skeleton,
  Text,
} from '@chakra-ui/react';
import axios from 'axios';
import Avatar from 'boring-avatars';
import NextLink from 'next/link';
import { useEffect, useState } from 'react';
import { AiOutlineEdit } from 'react-icons/ai';
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
                  color="brand.slate.500"
                  _hover={{
                    color: 'brand.slate.800',
                  }}
                  href={`/edit/sponsor`}
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
          <Box>
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
          <Box>
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
          <Box>
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
