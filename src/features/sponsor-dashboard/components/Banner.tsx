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
import NextLink from 'next/link';
import { usePostHog } from 'posthog-js/react';
import { AiOutlineEdit } from 'react-icons/ai';
import { MdInfoOutline, MdOutlineChatBubbleOutline } from 'react-icons/md';

import { VerifiedBadgeLarge } from '@/components/shared/VerifiedBadge';
import { PDTG } from '@/constants';
import { EarnAvatar } from '@/features/talent';
import { useUser } from '@/store/user';

export function Banner({
  isHackathon,
  stats,
  isLoading,
}: {
  isHackathon?: boolean;
  stats: any;
  isLoading: boolean;
}) {
  const { user } = useUser();
  const posthog = usePostHog();
  const sponsorId = isHackathon ? user?.hackathonId : user?.currentSponsorId;

  const tooltipTextReward = `Total compensation (in USD) of listings where the winners have been announced`;
  const tooltipTextListings = `Total number of listings added to Earn`;
  const tooltipTextSubmissions = `Total number of submissions/applications received on all listings`;

  const sponsor = isHackathon ? stats : user?.currentSponsor;

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
        <Flex align="center" gap={8}>
          <Flex align="center" flexShrink={0} gap={3}>
            <EarnAvatar
              size="52px"
              id={sponsor?.name}
              avatar={sponsor?.logo}
              borderRadius="rounded-sm"
            />
            <div>
              <Box alignItems={'center'} flexDir={'row'} display={'flex'}>
                <Flex align={'center'} gap={1} w="min-content">
                  <Text
                    color={'brand.slate.900'}
                    fontSize="lg"
                    fontWeight={600}
                    whiteSpace={'nowrap'}
                  >
                    {sponsor?.name}
                  </Text>
                  <div>{!!sponsor?.isVerified && <VerifiedBadgeLarge />}</div>
                </Flex>

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
                  {!isHackathon
                    ? `Sponsor since ${stats?.yearOnPlatform}`
                    : 'Hackathon'}
                </Text>
              )}
            </div>
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
                  {!isHackathon ? 'Rewarded' : 'Total Prizes'}
                </Text>
                <MdInfoOutline color="#94a3b8" size={16} />
              </Flex>
              {isLoading ? (
                <Skeleton w="72px" h="20px" mt={2} />
              ) : (
                <Text color={'brand.slate.900'} fontSize="lg" fontWeight={600}>
                  $
                  {new Intl.NumberFormat('en-US', {
                    maximumFractionDigits: 0,
                  }).format(Math.round(stats?.totalRewardAmount || 0))}
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
                  {!isHackathon ? 'Listings' : 'Tracks'}
                </Text>
                <MdInfoOutline color="#94a3b8" size={16} />
              </Flex>
              {isLoading ? (
                <Skeleton w="32px" h="20px" mt={2} />
              ) : (
                <Text color={'brand.slate.900'} fontSize="lg" fontWeight={600}>
                  {stats?.totalListingsAndGrants}
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
                  {stats?.totalSubmissionsAndApplications}
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
          className="ph-no-capture"
          _hover={{ textDecoration: 'none' }}
          href={PDTG}
          isExternal
          onClick={() => posthog.capture('message pratik_sponsor')}
        >
          <Flex align={'center'} justify={'space-between'}>
            <Flex align={'center'}>
              <Image
                w={'3.2rem'}
                h={14}
                mr={3}
                alt="message pratik"
                src="/assets/sponsor/pratik.webp"
              />
              <div>
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
                  Message Us
                </Text>
              </div>
            </Flex>
            <MdOutlineChatBubbleOutline color="#1E293B" size={24} />
          </Flex>
        </Link>
      </Box>
    </Flex>
  );
}
