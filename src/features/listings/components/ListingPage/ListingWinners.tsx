import {
  Box,
  Button,
  Center,
  Flex,
  HStack,
  Link,
  Text,
  useBreakpointValue,
} from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import NextLink from 'next/link';
import { usePostHog } from 'posthog-js/react';

import { Tooltip } from '@/components/shared/responsive-tooltip';
import { BONUS_REWARD_POSITION } from '@/constants';
import { formatTotalPrice } from '@/features/listing-builder';
import { EarnAvatar } from '@/features/talent';
import { type SubmissionWithUser } from '@/interface/submission';
import { tweetEmbedLink } from '@/utils/socialEmbeds';

const getRankLabel = (position: number | null | undefined) => {
  if (!position && position !== 0) return '';
  if (position === BONUS_REWARD_POSITION) return 'bonus';

  const suffixes = ['th', 'st', 'nd', 'rd', 'th'];
  const relevantDigits = position % 100;
  const suffix =
    relevantDigits >= 11 && relevantDigits <= 13
      ? 'th'
      : suffixes[Math.min(relevantDigits % 10, 4)];

  return `${position}${suffix}`;
};

const getRewardAmount = (
  bounty: Listing | undefined,
  position: number | null | undefined,
) => {
  if (!bounty?.rewards || position === undefined || position === null)
    return '';

  if (position === BONUS_REWARD_POSITION) {
    const bonusAmount = bounty?.rewards?.bonus ?? 0;
    return bonusAmount > 0
      ? `${formatTotalPrice(bonusAmount)} ${bounty?.token || ''}`.trim()
      : '';
  }

  const amount = bounty?.rewards[Number(position) as keyof Rewards] ?? 0;
  return amount > 0
    ? `${formatTotalPrice(amount)} ${bounty?.token || ''}`.trim()
    : '';
};

import { listingWinnersQuery } from '../../queries/listing-winners';
import type { Listing, Rewards } from '../../types';
import { tweetTemplate } from '../../utils';

interface Props {
  bounty: Listing;
}

const getOrRemoveBonuses = (
  submissions: SubmissionWithUser[],
  removeBonus: boolean,
) => {
  if (removeBonus)
    return submissions.filter(
      (s) => s.winnerPosition !== BONUS_REWARD_POSITION,
    );
  else
    return submissions.filter(
      (s) => s.winnerPosition === BONUS_REWARD_POSITION,
    );
};

export function ListingWinners({ bounty }: Props) {
  const isProject = bounty?.type === 'project';

  const posthog = usePostHog();
  const isMD = useBreakpointValue({ base: false, md: true });

  const { data: submissions = [], isLoading } = useQuery(
    listingWinnersQuery(bounty?.id),
  );

  const openWinnerLink = () => {
    let path = window.location.href.split('?')[0];
    if (!path) return;
    path += 'winner/';

    return tweetEmbedLink(tweetTemplate(path));
  };

  if (isLoading || !submissions.length) {
    return null;
  }

  // Sort submissions by winnerPosition
  const sortedSubmissions = [...submissions].sort((a, b) => {
    const posA = a.winnerPosition ?? Infinity;
    const posB = b.winnerPosition ?? Infinity;
    return posA - posB;
  });

  return (
    <Box
      pos="relative"
      w="full"
      maxW={'7xl'}
      mx={'auto'}
      px={4}
      pt={4}
      bg="#F5F3FF"
      rounded="lg"
    >
      <HStack justify="space-between">
        <Text
          mx={3}
          color="brand.slate.500"
          fontSize={{ md: 'xl' }}
          fontWeight={600}
        >
          🎉 Winners
        </Text>
        <NextLink href={openWinnerLink() ?? '#'} target="_blank">
          <Button
            className="ph-no-capture"
            gap={2}
            display="flex"
            w={'auto'}
            h="min-content"
            px={{ base: 2, md: 3 }}
            py={{ base: 1.5, md: 2 }}
            color="rgba(0, 0, 0, 0.65)"
            fontSize={{ base: 'sm', md: 'medium' }}
            fontWeight={500}
            bg="white"
            border="1px solid"
            borderColor="brand.slate.300"
            _hover={{ background: 'rgba(255, 255, 255, 0.8)' }}
            _active={{ background: 'rgba(255, 255, 255, 0.5)' }}
            onClick={() => posthog.capture('click to tweet_listing')}
          >
            <Center w={{ base: '0.9rem', md: '1.1rem' }} h="min-content">
              <svg
                width="33px"
                viewBox="0 0 33 33"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M25.0851 3.09375H29.6355L19.6968 14.4504L31.3886 29.9062H22.2363L15.0626 20.5348L6.86421 29.9062H2.30737L12.9357 17.7568L1.72729 3.09375H11.1117L17.5892 11.6596L25.0851 3.09375ZM23.4867 27.1863H26.0068L9.73882 5.67188H7.03179L23.4867 27.1863Z"
                  fill="black"
                />
              </svg>
            </Center>
            分享
          </Button>
        </NextLink>
      </HStack>
      <Box mx={3} mt={{ base: 2, md: 0 }}>
        <Box
          w="full"
          px={{ base: 3, md: 4 }}
          py={{ base: 4, md: 4 }}
          color="white"
          rounded="md"
        >
          <Flex
            align="center"
            justify="center"
            wrap="wrap"
            gap={{ base: 6, md: 8 }}
          >
            {getOrRemoveBonuses(sortedSubmissions, true)
              .slice(0, 3)
              .map((submission) => (
                <NextLink
                  key={submission.id}
                  href={
                    !isProject
                      ? `/feed/submission/${submission?.id}`
                      : `/t/${submission?.user?.username}`
                  }
                  passHref
                >
                  <Flex
                    as="a"
                    align="center"
                    justify="center"
                    direction={'column'}
                    cursor="pointer"
                  >
                    <Box pos="relative">
                      {!isProject &&
                        submission?.winnerPosition !==
                          BONUS_REWARD_POSITION && (
                          <Center
                            pos="absolute"
                            zIndex={1}
                            bottom={2}
                            left="50%"
                            w={{ base: 8, md: 10 }}
                            h={{ base: 5, md: 6 }}
                            px={1}
                            color="brand.slate.500"
                            fontSize={{ base: '2xs', md: 'xx-small' }}
                            fontWeight={600}
                            textAlign="center"
                            textTransform="capitalize"
                            bg="#fff"
                            border="1px solid"
                            borderColor="brand.slate.300"
                            transform="translateX(-50%)"
                            rounded={'full'}
                          >
                            {getRankLabel(submission?.winnerPosition)}
                          </Center>
                        )}
                      {!isProject &&
                        submission?.winnerPosition ===
                          BONUS_REWARD_POSITION && (
                          <Center
                            pos="absolute"
                            zIndex={1}
                            bottom={2}
                            left="50%"
                            w={{ base: 8, md: 10 }}
                            h={{ base: 5, md: 6 }}
                            px={1}
                            color="brand.slate.500"
                            fontSize={{ base: '2xs', md: 'xx-small' }}
                            fontWeight={600}
                            textAlign="center"
                            textTransform="capitalize"
                            bg="#fff"
                            border="1px solid"
                            borderColor="brand.slate.300"
                            transform="translateX(-50%)"
                            rounded={'full'}
                          >
                            bonus
                          </Center>
                        )}
                      <EarnAvatar
                        size={isMD ? '64px' : '52px'}
                        id={submission?.user?.id}
                        avatar={submission?.user?.photo as string}
                      />
                    </Box>
                    <Text
                      w={{ base: 'min-content', md: 'auto' }}
                      pt={4}
                      color="brand.slate.700"
                      fontSize={{ base: 'xs', md: 'sm' }}
                      fontWeight={600}
                      textAlign={'center'}
                      noOfLines={2}
                    >{`${submission?.user?.firstName} ${submission?.user?.lastName}`}</Text>
                    <Text
                      color="brand.slate.500"
                      fontSize={'xs'}
                      fontWeight={400}
                      textAlign="center"
                      opacity={0.6}
                    >
                      {getRewardAmount(bounty, submission?.winnerPosition)}
                    </Text>
                  </Flex>
                </NextLink>
              ))}
          </Flex>
        </Box>
      </Box>
      {(getOrRemoveBonuses(sortedSubmissions, true).length > 3 ||
        getOrRemoveBonuses(sortedSubmissions, false).length > 0) && (
        <HStack
          justify="center"
          flexWrap="wrap"
          gap={{ base: 2, md: 3 }}
          px={2}
          py={3}
          borderColor="#DDD6FE"
          borderTopWidth="1px"
        >
          {[
            ...getOrRemoveBonuses(sortedSubmissions, true).slice(3),
            ...getOrRemoveBonuses(sortedSubmissions, false),
          ].map((submission) => (
            <Box key={submission.id} pos="relative">
              <Tooltip
                label={`${submission?.user?.firstName} ${submission?.user?.lastName} (${submission?.winnerPosition === BONUS_REWARD_POSITION ? 'bonus' : getRankLabel(submission?.winnerPosition)})`}
              >
                <Link
                  key={submission.id}
                  as={NextLink}
                  href={
                    !isProject
                      ? `/feed/submission/${submission?.id}`
                      : `/t/${submission?.user?.username}`
                  }
                  passHref
                >
                  <Box pos="relative">
                    {!isProject &&
                      submission?.winnerPosition !== BONUS_REWARD_POSITION && (
                        <Center
                          pos="absolute"
                          zIndex={1}
                          bottom={0}
                          left="50%"
                          w={{ base: 5, md: 6 }}
                          h={{ base: 3.5, md: 4 }}
                          px={0.5}
                          color="brand.slate.500"
                          fontSize={{ base: '3xs', md: '3xs' }}
                          fontWeight={600}
                          textAlign="center"
                          bg="#fff"
                          border="1px solid"
                          borderColor="brand.slate.300"
                          transform="translateX(-50%)"
                          rounded={'full'}
                        >
                          {getRankLabel(submission?.winnerPosition)}
                        </Center>
                      )}
                    {!isProject &&
                      submission?.winnerPosition === BONUS_REWARD_POSITION && (
                        <Center
                          pos="absolute"
                          zIndex={1}
                          bottom={0}
                          left="50%"
                          w={{ base: 5, md: 6 }}
                          h={{ base: 3.5, md: 4 }}
                          px={0.5}
                          color="brand.slate.500"
                          fontSize={{ base: '3xs', md: '3xs' }}
                          fontWeight={600}
                          textAlign="center"
                          bg="#fff"
                          border="1px solid"
                          borderColor="brand.slate.300"
                          transform="translateX(-50%)"
                          rounded={'full'}
                        >
                          bonus
                        </Center>
                      )}
                    <EarnAvatar
                      size={isMD ? '44px' : '36px'}
                      id={submission?.user?.id}
                      avatar={submission?.user?.photo as string}
                    />
                  </Box>
                </Link>
              </Tooltip>
            </Box>
          ))}
        </HStack>
      )}

      {/* Add some bottom padding for better spacing */}
      <Box pb={2} />
    </Box>
  );
}
