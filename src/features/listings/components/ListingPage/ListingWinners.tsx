import { Box, Button, Center, Flex, Text } from '@chakra-ui/react';
import axios from 'axios';
import NextLink from 'next/link';
import { useEffect, useState } from 'react';

import { EarnAvatar } from '@/components/shared/EarnAvatar';
import type { SubmissionWithUser } from '@/interface/submission';
import { sortRank } from '@/utils/rank';

import type { Bounty, Rewards } from '../../types';
import { tweetEmbedLink, tweetTemplate } from '../../utils';

interface Props {
  bounty: Bounty;
}

export function ListingWinners({ bounty }: Props) {
  const [isListingLoading, setIsListingLoading] = useState(true);
  const [submissions, setSubmissions] = useState<SubmissionWithUser[]>([]);

  const isProject = bounty?.type === 'project';

  const getSubmissions = async (id?: string) => {
    setIsListingLoading(true);
    try {
      const submissionsDetails = await axios.get(
        `/api/submission/${id || bounty?.id}/winners/`,
      );
      const { data } = submissionsDetails;
      const winners = sortRank(
        data.map(
          (submission: SubmissionWithUser) => submission.winnerPosition || '',
        ),
      );
      const sortedSubmissions = winners.map((position) =>
        data.find((d: SubmissionWithUser) => d.winnerPosition === position),
      );
      setSubmissions(sortedSubmissions);
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
    <Box maxW={'8xl'} mx={'auto'} mt={10}>
      <Text
        mx={3}
        mb={4}
        color="brand.slate.500"
        fontSize={{ base: 'lg', md: 'xl' }}
        fontWeight={600}
      >
        🎉 Winners Announced
      </Text>
      <Box mx={3}>
        <Box
          pos="relative"
          w="full"
          px={{ base: 3, md: 10 }}
          py={6}
          color="white"
          bg="radial-gradient(circle, rgba(159,65,255,1) 25%, rgba(99,102,241,1) 100%);"
          rounded="md"
        >
          <Flex align="center" justify="center" wrap="wrap" gap={10}>
            {submissions.map((submission) => (
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
                  pos="relative"
                  align="center"
                  justify="center"
                  direction={'column'}
                  cursor="pointer"
                >
                  <Text
                    pos="absolute"
                    top={-2}
                    px={1}
                    color="white"
                    fontSize={{ base: 'xx-small', md: 'xs' }}
                    fontWeight={700}
                    textAlign="center"
                    textTransform="capitalize"
                    bg="brand.purple"
                    rounded={'full'}
                  >
                    {isProject ? 'Winner' : submission?.winnerPosition}
                  </Text>
                  <EarnAvatar
                    size="64px"
                    id={submission?.user?.id}
                    avatar={submission?.user?.photo as string}
                  />
                  <Text
                    fontSize={{ base: 'xs', md: 'sm' }}
                    fontWeight={600}
                    textAlign={'center'}
                  >{`${submission?.user?.firstName} ${submission?.user?.lastName}`}</Text>
                  <Text
                    fontSize={{ base: 'xx-small', md: 'xs' }}
                    fontWeight={400}
                    textAlign="center"
                    opacity={0.6}
                  >
                    {bounty?.token}{' '}
                    {bounty?.rewards &&
                      bounty?.rewards[
                        submission?.winnerPosition as keyof Rewards
                      ]}
                  </Text>
                </Flex>
              </NextLink>
            ))}
          </Flex>
          <NextLink href={openWinnerLink() ?? '#'} target="_blank">
            <Button
              pos={{ base: 'static', md: 'absolute' }}
              top={5}
              right={5}
              gap={2}
              display="flex"
              w={{ base: '100%', md: 'auto' }}
              mt={{ base: 6, md: 0 }}
              color="rgba(0, 0, 0, 0.65)"
              fontSize="14px"
              fontWeight={500}
              bg="white"
              _hover={{ background: 'rgba(255, 255, 255, 0.8)' }}
              _active={{ background: 'rgba(255, 255, 255, 0.5)' }}
            >
              Share on
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
            </Button>
          </NextLink>
        </Box>
      </Box>
    </Box>
  );
}
