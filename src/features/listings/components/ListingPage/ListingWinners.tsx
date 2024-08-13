import { Box, Button, Center, Flex, HStack, Text } from '@chakra-ui/react';
import axios from 'axios';
import NextLink from 'next/link';
import { usePostHog } from 'posthog-js/react';
import { useEffect, useState } from 'react';

import { EarnAvatar } from '@/components/shared/EarnAvatar';
import { Tooltip } from '@/components/shared/responsive-tooltip';
import type { SubmissionWithUser } from '@/interface/submission';
import { nthLabelGenerator } from '@/utils/rank';
import { tweetEmbedLink } from '@/utils/socialEmbeds';

import type { Listing, Rewards } from '../../types';
import { tweetTemplate } from '../../utils';

interface Props {
  bounty: Listing;
}

const formatPrize = (total: number) =>
  new Intl.NumberFormat('en-US', {
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(total as number);
export function ListingWinners({ bounty }: Props) {
  const [isListingLoading, setIsListingLoading] = useState(true);
  const [submissions, setSubmissions] = useState<SubmissionWithUser[]>([]);
  console.log('submissions', submissions);

  const isProject = bounty?.type === 'project';

  const posthog = usePostHog();

  const getSubmissions = async (id?: string) => {
    setIsListingLoading(true);
    try {
      const submissionsDetails = await axios.get(
        `/api/listings/${id || bounty?.id}/winners/`,
      );
      const { data } = submissionsDetails;
      const winners = data.sort(
        (a: SubmissionWithUser, b: SubmissionWithUser) => {
          if (!a.winnerPosition) return 1;
          if (!b.winnerPosition) return -1;
          return Number(a.winnerPosition) - Number(b.winnerPosition);
        },
      );

      // const sortedSubmissions = winners.map((position) =>
      //   data.find((d: SubmissionWithUser) => d.winnerPosition === position),
      // );
      setSubmissions(winners);
      setIsListingLoading(false);
    } catch (e) {
      setIsListingLoading(false);
    }
  };

  useEffect(() => {
    getSubmissions();
  }, []);

  const openWinnerLink = () => {
    let path = window.location.href.split('?')[0];
    if (!path) return;
    path += 'winner/';

    return tweetEmbedLink(tweetTemplate(path));
  };

  if (isListingLoading || !submissions.length) {
    return null;
  }

  return (
    <Box
      pos="relative"
      w="full"
      maxW={'8xl'}
      mx={'auto'}
      px={4}
      pt={4}
      bg="#F5F3FF"
      rounded="lg"
    >
      <Text
        mx={3}
        mb={4}
        color="brand.slate.500"
        fontSize={{ base: 'lg', md: 'xl' }}
        fontWeight={600}
      >
        🎉 Winners
      </Text>
      <Box mx={3}>
        <Box
          w="full"
          px={{ base: 3, md: 10 }}
          py={6}
          color="white"
          rounded="md"
        >
          <Flex align="center" justify="center" wrap="wrap" gap={10}>
            {submissions.slice(0, 3).map((submission) => (
              <NextLink
                key={submission.id}
                href={
                  !isProject
                    ? `/listings/${bounty?.type}/${bounty?.slug}/submission/${submission?.id}/`
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
                    <Center
                      pos="absolute"
                      bottom={-3}
                      left="50%"
                      w={6}
                      h={6}
                      px={1}
                      color="brand.slate.500"
                      fontSize={'xx-small'}
                      fontWeight={600}
                      textAlign="center"
                      textTransform="capitalize"
                      bg="#fff"
                      transform="translateX(-50%)"
                      rounded={'full'}
                    >
                      {isProject
                        ? 'Winner'
                        : nthLabelGenerator(submission?.winnerPosition ?? 0)}
                    </Center>
                    <EarnAvatar
                      size="64px"
                      id={submission?.user?.id}
                      avatar={submission?.user?.photo as string}
                    />
                  </Box>
                  <Text
                    pt={4}
                    color="brand.slate.700"
                    fontSize={{ base: 'xs', md: 'sm' }}
                    fontWeight={600}
                    textAlign={'center'}
                  >{`${submission?.user?.firstName} ${submission?.user?.lastName}`}</Text>
                  <Text
                    color="brand.slate.500"
                    fontSize={{ base: 'xx-small', md: 'xs' }}
                    fontWeight={400}
                    textAlign="center"
                    opacity={0.6}
                  >
                    {bounty?.rewards &&
                      formatPrize(
                        bounty?.rewards[
                          Number(submission?.winnerPosition) as keyof Rewards
                        ] ?? 0,
                      )}{' '}
                    {bounty?.token}
                  </Text>
                </Flex>
              </NextLink>
            ))}
          </Flex>
          <NextLink href={openWinnerLink() ?? '#'} target="_blank">
            <Button
              className="ph-no-capture"
              pos={'absolute'}
              top={4}
              right={5}
              gap={2}
              display="flex"
              w={'auto'}
              color="rgba(0, 0, 0, 0.65)"
              fontWeight={500}
              bg="white"
              border="1px solid"
              borderColor="brand.slate.300"
              _hover={{ background: 'rgba(255, 255, 255, 0.8)' }}
              _active={{ background: 'rgba(255, 255, 255, 0.5)' }}
              onClick={() => posthog.capture('click to tweet_listing')}
            >
              <Center w="1.2rem">
                <svg
                  width="33px"
                  height="33px"
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
              Share
            </Button>
          </NextLink>
        </Box>
      </Box>
      {submissions.length > 3 && (
        <HStack
          justify="center"
          flexWrap="wrap"
          px={2}
          py={3}
          borderColor="#DDD6FE"
          borderTopWidth="1px"
        >
          {submissions.slice(3).map((submission) => (
            <Tooltip key={submission.id} label={submission?.user?.firstName}>
              <NextLink
                key={submission.id}
                href={
                  !isProject
                    ? `/listings/${bounty?.type}/${bounty?.slug}/submission/${submission?.id}/`
                    : `/t/${submission?.user?.username}`
                }
                passHref
              >
                <EarnAvatar
                  size="44px"
                  id={submission?.user?.id}
                  avatar={submission?.user?.photo as string}
                />
              </NextLink>
            </Tooltip>
          ))}
        </HStack>
      )}
    </Box>
  );
}
