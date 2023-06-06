import { Box, Flex, Image, Text } from '@chakra-ui/react';
import axios from 'axios';
import Avatar from 'boring-avatars';
import NextLink from 'next/link';
import { useEffect, useState } from 'react';

import type { Bounty, Rewards } from '@/interface/bounty';
import type { SubmissionWithUser } from '@/interface/submission';
import { sortRank } from '@/utils/rank';

interface Props {
  bounty: Bounty;
}

function BountyWinners({ bounty }: Props) {
  const [isBountyLoading, setIsBountyLoading] = useState(true);
  const [submissions, setSubmissions] = useState<SubmissionWithUser[]>([]);

  const getSubmissions = async (id?: string) => {
    setIsBountyLoading(true);
    try {
      const submissionsDetails = await axios.get(
        `/api/submission/${id || bounty?.id}/winners/`
      );
      const { data } = submissionsDetails;
      const winners = sortRank(
        data.map(
          (submission: SubmissionWithUser) => submission.winnerPosition || ''
        )
      );
      const sortedSubmissions = winners.map((position) =>
        data.find((d: SubmissionWithUser) => d.winnerPosition === position)
      );
      setSubmissions(sortedSubmissions);
      setIsBountyLoading(false);
    } catch (e) {
      setIsBountyLoading(false);
    }
  };

  useEffect(() => {
    getSubmissions();
  }, []);

  if (isBountyLoading || !submissions.length) {
    return null;
  }
  console.log(
    'file: BountyWinners.tsx:34 ~ BountyWinners ~ submissions:',
    submissions
  );

  return (
    <Box maxW={'7xl'} mt={10} mx={'auto'}>
      <Text mb={4} color="brand.slate.500" fontSize="xl" fontWeight={600}>
        🎉 Winners Announced
      </Text>
      <Box
        w="full"
        px={10}
        py={6}
        color="white"
        bg="radial-gradient(circle, rgba(159,65,255,1) 25%, rgba(99,102,241,1) 100%);"
        rounded="md"
      >
        <Flex align="center" justify="center" gap={10}>
          {submissions.map((submission) => (
            <NextLink
              key={submission.id}
              href={`/listings/bounties/${bounty?.slug}/submission/${submission?.id}/`}
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
                  fontSize="xs"
                  fontWeight={700}
                  textAlign="center"
                  textTransform="capitalize"
                  bg="brand.purple"
                  rounded={'full'}
                >
                  {submission?.winnerPosition}
                </Text>
                {submission?.user?.photo ? (
                  <Image
                    boxSize="72px"
                    borderRadius="full"
                    alt={`${submission?.user?.firstName} ${submission?.user?.lastName}`}
                    src={submission?.user?.photo}
                  />
                ) : (
                  <Avatar
                    name={`${submission?.user?.firstName} ${submission?.user?.lastName}`}
                    colors={['#92A1C6', '#F0AB3D', '#C271B4']}
                    size={72}
                    variant="marble"
                  />
                )}
                <Text
                  fontSize="sm"
                  fontWeight={600}
                >{`${submission?.user?.firstName} ${submission?.user?.lastName}`}</Text>
                <Text fontSize="xs" fontWeight={300} opacity={0.6}>
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
      </Box>
    </Box>
  );
}

export default BountyWinners;
