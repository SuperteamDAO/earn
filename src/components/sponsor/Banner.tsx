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
import { useEffect, useState } from 'react';
import { MdOutlineChatBubbleOutline } from 'react-icons/md';

import { userStore } from '@/store/user';

interface SponsorStats {
  yearOnPlatform?: number;
  totalRewardAmount?: number;
  totalListings?: number;
  totalSubmissions?: number;
}

export function Banner() {
  const { userInfo } = userStore();
  const [sponsorStats, setSponsorStats] = useState<SponsorStats>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const getSponsorStats = async () => {
      const sponsorData = await axios.get('/api/sponsors/stats');
      setSponsorStats(sponsorData.data);
      setIsLoading(false);
    };
    getSponsorStats();
  }, [userInfo?.currentSponsorId]);

  if (!userInfo?.currentSponsorId) return null;
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
            {userInfo?.currentSponsor?.logo ? (
              <Image
                boxSize="52px"
                borderRadius={4}
                alt={userInfo?.currentSponsor?.name}
                src={userInfo?.currentSponsor?.logo}
              />
            ) : (
              <Avatar
                colors={['#92A1C6', '#F0AB3D', '#C271B4']}
                name={userInfo?.currentSponsor?.name}
                size={54}
                variant="marble"
              />
            )}
            <Box>
              <Text color={'brand.slate.900'} fontSize="lg" fontWeight={600}>
                {userInfo?.currentSponsor?.name}
              </Text>
              {isLoading ? (
                <Skeleton w="170px" h="20px" mt={2} />
              ) : (
                <Text
                  color={'brand.slate.500'}
                  fontWeight={400}
                  whiteSpace={'nowrap'}
                >
                  Sponsor since {sponsorStats.yearOnPlatform}
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
            <Text color={'brand.slate.500'} fontSize="md" fontWeight={400}>
              Rewarded
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
              Listings
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
                  Stuck with something?
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
