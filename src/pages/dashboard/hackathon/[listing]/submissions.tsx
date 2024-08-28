import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import {
  Button,
  Flex,
  Grid,
  GridItem,
  Image,
  Text,
  useDisclosure,
} from '@chakra-ui/react';
import { type SubmissionLabels } from '@prisma/client';
import axios from 'axios';
import type { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { LoadingSection } from '@/components/shared/LoadingSection';
import { type Listing, PublishResults } from '@/features/listings';
import {
  SubmissionDetails,
  SubmissionHeader,
  SubmissionList,
} from '@/features/sponsor-dashboard';
import type { SubmissionWithUser } from '@/interface/submission';
import { SponsorLayout } from '@/layouts/Sponsor';
import { useUser } from '@/store/user';
import { cleanRewards, sortRank } from '@/utils/rank';

interface Props {
  listing: string;
}

function BountySubmissions({ listing }: Props) {
  const router = useRouter();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { user } = useUser();
  const [bounty, setBounty] = useState<Listing | null>(null);
  const [totalSubmissions, setTotalSubmissions] = useState(0);
  const [totalWinners, setTotalWinners] = useState(0);
  const [totalPaymentsMade, setTotalPaymentsMade] = useState(0);
  const [submissions, setSubmissions] = useState<SubmissionWithUser[]>([]);
  const [selectedSubmission, setSelectedSubmission] =
    useState<SubmissionWithUser>();
  const [rewards, setRewards] = useState<number[]>([]);
  const [isBountyLoading, setIsBountyLoading] = useState(true);
  const [skip, setSkip] = useState(0);
  const length = 10;
  const [searchText, setSearchText] = useState('');

  const [usedPositions, setUsedPositions] = useState<number[]>([]);
  const [remainings, setRemainings] = useState<{
    podiums: number;
    bonus: number;
  } | null>(null);
  const [filterLabel, setFilterLabel] = useState<SubmissionLabels | undefined>(
    undefined,
  );

  useEffect(() => {}, [bounty]);

  const getBounty = async () => {
    setIsBountyLoading(true);
    try {
      const bountyDetails = await axios.get(
        `/api/sponsor-dashboard/${listing}/listing?type=hackathon`,
      );
      setBounty(bountyDetails.data);
      if (bountyDetails.data.hackathonId !== user?.hackathonId) {
        router.push(`/dashboard/hackathon/`);
      }
      setTotalPaymentsMade(bountyDetails.data.paymentsMade || 0);

      const usedPos: number[] = bountyDetails.data.Submission.filter(
        (s: any) => s.isWinner,
      )
        .map((s: any) => Number(s.winnerPosition))
        .filter((key: number) => !isNaN(key));
      setUsedPositions(usedPos);

      setTotalSubmissions(bountyDetails.data.totalSubmissions);
      setTotalWinners(bountyDetails.data.winnersSelected);
      setTotalPaymentsMade(bountyDetails.data.paymentsMade);

      const rewardsLength = cleanRewards(
        bountyDetails.data?.rewards,
        true,
      ).length;
      setRemainings({
        podiums:
          rewardsLength - (bountyDetails.data.podiumWinnersSelected || 0),
        bonus:
          (bountyDetails.data?.maxBonusSpots || 0) -
          (bountyDetails.data.bonusWinnerSelected || 0),
      });

      const ranks = sortRank(cleanRewards(bountyDetails.data.rewards));
      setRewards(ranks);
      setIsBountyLoading(false);
    } catch (e) {
      setIsBountyLoading(false);
    }
  };

  const getSubmissions = async () => {
    try {
      const submissionDetails = await axios.get(
        `/api/sponsor-dashboard/${listing}/submissions`,
        {
          params: {
            searchText,
            take: length,
            skip,
            isHackathon: true,
            label: filterLabel,
          },
        },
      );
      setSubmissions(submissionDetails.data);
      setSelectedSubmission(submissionDetails.data[0]);
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    if (user?.currentSponsorId) {
      getSubmissions();
    }
  }, [user?.currentSponsorId, skip, searchText, filterLabel]);

  useEffect(() => {
    if (user?.currentSponsorId) {
      getBounty();
    }
  }, [user?.currentSponsorId]);

  return (
    <SponsorLayout isCollapsible>
      {isBountyLoading ? (
        <LoadingSection />
      ) : (
        <>
          {isOpen && (
            <PublishResults
              remaining={remainings}
              isOpen={isOpen}
              onClose={onClose}
              totalWinners={totalWinners}
              totalPaymentsMade={totalPaymentsMade}
              bounty={bounty}
            />
          )}
          <SubmissionHeader
            bounty={bounty}
            totalSubmissions={totalSubmissions}
            isHackathonPage
          />
          <Flex align={'start'} w="full" bg="white">
            <Grid templateColumns="23rem 1fr" w="full" minH="600px" bg="white">
              <GridItem w="full" h="full">
                <SubmissionList
                  filterLabel={filterLabel}
                  setFilterLabel={setFilterLabel}
                  submissions={submissions}
                  setSearchText={setSearchText}
                  selectedSubmission={selectedSubmission}
                  setSelectedSubmission={setSelectedSubmission}
                  type={bounty?.type}
                />
              </GridItem>
              <GridItem
                w="full"
                h="full"
                bg="white"
                borderColor="brand.slate.200"
                borderTopWidth="1px"
                borderRightWidth={'1px'}
                borderBottomWidth="1px"
                roundedRight={'xl'}
              >
                {!submissions?.length && !searchText && !isBountyLoading ? (
                  <>
                    <Image
                      w={32}
                      mx="auto"
                      mt={32}
                      alt={'talent empty'}
                      src="/assets/bg/talent-empty.svg"
                    />
                    <Text
                      mx="auto"
                      mt={5}
                      color={'brand.slate.600'}
                      fontSize={'lg'}
                      fontWeight={600}
                      textAlign={'center'}
                    >
                      {filterLabel ? `Zero Results` : 'People are working!'}
                    </Text>
                    <Text
                      mx="auto"
                      mb={200}
                      color={'brand.slate.400'}
                      fontWeight={500}
                      textAlign={'center'}
                    >
                      {filterLabel
                        ? `For the filters you have selected`
                        : 'Submissions will start appearing here'}
                    </Text>
                  </>
                ) : (
                  <SubmissionDetails
                    remainings={remainings}
                    setRemainings={setRemainings}
                    bounty={bounty}
                    submissions={submissions}
                    setSubmissions={setSubmissions}
                    selectedSubmission={selectedSubmission}
                    setSelectedSubmission={setSelectedSubmission}
                    rewards={rewards}
                    usedPositions={usedPositions}
                    setUsedPositions={setUsedPositions}
                    setTotalPaymentsMade={setTotalPaymentsMade}
                    setTotalWinners={setTotalWinners}
                    onWinnersAnnounceOpen={onOpen}
                  />
                )}
              </GridItem>
            </Grid>
          </Flex>
          <Flex align="center" justify="start" gap={4} mt={4}>
            {!!searchText ? (
              <Text color="brand.slate.400" fontSize="sm">
                Found{' '}
                <Text as="span" fontWeight={700}>
                  {submissions.length}
                </Text>{' '}
                {submissions.length === 1 ? 'result' : 'results'}
              </Text>
            ) : (
              <>
                <Button
                  isDisabled={skip <= 0}
                  leftIcon={<ChevronLeftIcon w={5} h={5} />}
                  onClick={() =>
                    skip >= length ? setSkip(skip - length) : setSkip(0)
                  }
                  size="sm"
                  variant="outline"
                >
                  Previous
                </Button>
                <Text color="brand.slate.400" fontSize="sm">
                  <Text as="span" fontWeight={700}>
                    {skip + 1}
                  </Text>{' '}
                  -{' '}
                  <Text as="span" fontWeight={700}>
                    {Math.min(skip + length, totalSubmissions)}
                  </Text>{' '}
                  of{' '}
                  <Text as="span" fontWeight={700}>
                    {totalSubmissions}
                  </Text>{' '}
                  Submissions
                </Text>
                <Button
                  isDisabled={
                    totalSubmissions <= skip + length ||
                    (skip > 0 && skip % length !== 0)
                  }
                  onClick={() => skip % length === 0 && setSkip(skip + length)}
                  rightIcon={<ChevronRightIcon w={5} h={5} />}
                  size="sm"
                  variant="outline"
                >
                  Next
                </Button>
              </>
            )}
          </Flex>
        </>
      )}
    </SponsorLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { listing } = context.query;
  return {
    props: { listing },
  };
};

export default BountySubmissions;
