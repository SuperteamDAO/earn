import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  Flex,
  Grid,
  GridItem,
  Image,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  Tooltip,
  useDisclosure,
} from '@chakra-ui/react';
import { type SubmissionLabels } from '@prisma/client';
import axios from 'axios';
import type { GetServerSideProps } from 'next';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/router';
import { usePostHog } from 'posthog-js/react';
import { useEffect, useState } from 'react';

import { LoadingSection } from '@/components/shared/LoadingSection';
import { type Listing, PublishResults } from '@/features/listings';
import {
  type ScoutRowType,
  ScoutTable,
  SubmissionDetails,
  SubmissionHeader,
  SubmissionList,
} from '@/features/sponsor-dashboard';
import { type Scouts } from '@/interface/scouts';
import type { SubmissionWithUser } from '@/interface/submission';
import { SponsorLayout } from '@/layouts/Sponsor';
import { useUser } from '@/store/user';
import { dayjs } from '@/utils/dayjs';
import { cleanRewards, sortRank } from '@/utils/rank';

interface Props {
  slug: string;
}

const selectedStyles = {
  borderColor: 'brand.purple',
  color: 'brand.slate.600',
};

function BountySubmissions({ slug }: Props) {
  const router = useRouter();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { user } = useUser();
  const [bounty, setBounty] = useState<Listing | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isExpired, setIsExpired] = useState(false);
  const [totalSubmissions, setTotalSubmissions] = useState(0);
  const [totalWinners, setTotalWinners] = useState(0);
  const [totalPaymentsMade, setTotalPaymentsMade] = useState(0);
  const [submissions, setSubmissions] = useState<SubmissionWithUser[]>([]);
  const [scouts, setScouts] = useState<ScoutRowType[]>([]);
  const [selectedSubmission, setSelectedSubmission] =
    useState<SubmissionWithUser>();
  const [rewards, setRewards] = useState<number[]>([]);
  const [isBountyLoading, setIsBountyLoading] = useState(true);
  const [skip, setSkip] = useState(0);
  let length = 10;
  const [searchText, setSearchText] = useState('');

  const [usedPositions, setUsedPositions] = useState<number[]>([]);
  const [remainings, setRemainings] = useState<{
    podiums: number;
    bonus: number;
  } | null>(null);
  const [filterLabel, setFilterLabel] = useState<
    SubmissionLabels | 'Winner' | undefined
  >(undefined);

  const searchParams = useSearchParams();
  const posthog = usePostHog();

  useEffect(() => {
    if (searchText) {
      length = 999;
      if (skip !== 0) {
        setSkip(0);
      }
    } else {
      length = 10;
    }
  }, [searchText]);

  const getBounty = async () => {
    setIsBountyLoading(true);
    try {
      const bountyDetails = await axios.get(
        `/api/sponsor-dashboard/${slug}/listing/`,
      );
      const isExpired =
        bountyDetails.data?.deadline &&
        dayjs(bountyDetails.data?.deadline).isBefore(dayjs());
      setIsExpired(isExpired);
      setBounty(bountyDetails.data);
      if (bountyDetails.data.sponsorId !== user?.currentSponsorId) {
        router.push('/dashboard/listings');
      }
      if (
        bountyDetails.data.isPublished &&
        !bountyDetails.data.isWinnersAnnounced
      ) {
        await getScouts(bountyDetails.data.id as string);
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
      setIsLoading(true);
      const submissionDetails = await axios.get(
        `/api/sponsor-dashboard/${slug}/submissions`,
        {
          params: {
            searchText,
            take: length,
            skip,
            label: filterLabel,
          },
        },
      );
      setSubmissions(submissionDetails.data);
      setSelectedSubmission(submissionDetails.data[0]);
    } catch (e) {
      console.log(e);
    } finally {
      setIsLoading(false);
    }
  };

  const getScouts = async (id: string) => {
    try {
      const scoutsData = await axios.post<Scouts[]>(
        `/api/listings/scout/${id}`,
      );
      const scouts: ScoutRowType[] = scoutsData.data.map((scout) => ({
        id: scout.id,
        userId: scout.userId,
        skills: [...new Set(scout.skills)],
        dollarsEarned: scout.dollarsEarned,
        score: scout.score,
        recommended: scout.user.stRecommended ?? false,
        invited: scout.invited,
        pfp: scout.user.photo ?? null,
        name: (scout.user.firstName ?? '') + ' ' + (scout.user.lastName ?? ''),
        username: scout.user.username ?? null,
      }));
      setScouts(scouts);
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

  useEffect(() => {
    if (searchParams.has('scout')) posthog.capture('scout tab_scout');
  }, []);

  const isSponsorVerified = bounty?.sponsor?.isVerified;

  return (
    <SponsorLayout isCollapsible={true}>
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
          />
          <Tabs defaultIndex={searchParams.has('scout') ? 1 : 0}>
            <TabList
              gap={4}
              color="brand.slate.400"
              fontWeight={500}
              borderBottomWidth={'1px'}
            >
              <Tab px={1} fontSize="sm" _selected={selectedStyles}>
                Submissions
              </Tab>
              {bounty?.isPublished &&
                !bounty?.isWinnersAnnounced &&
                !isExpired && (
                  <Tooltip
                    px={4}
                    py={2}
                    color="brand.slate.500"
                    fontFamily={'var(--font-sans)'}
                    bg="white"
                    borderRadius={'lg'}
                    isDisabled={isSponsorVerified === true}
                    label="Scout is an invite-only feature right now"
                  >
                    <Tab
                      className="ph-no-capture"
                      px={1}
                      fontSize="sm"
                      _disabled={{ color: 'brand.slate.400' }}
                      _selected={selectedStyles}
                      cursor={isSponsorVerified ? 'pointer' : 'not-allowed'}
                      isDisabled={!isSponsorVerified}
                      onClick={() => posthog.capture('scout tab_scout')}
                    >
                      Scout Talent
                      {!!isSponsorVerified && (
                        <Box w={1.5} h={1.5} ml={1.5} bg="red" rounded="full" />
                      )}
                    </Tab>
                  </Tooltip>
                )}
            </TabList>
            <TabPanels>
              <TabPanel w="full" px={0}>
                <>
                  <Flex align={'start'} w="full" bg="white">
                    <Grid
                      templateColumns="23rem 1fr"
                      w="full"
                      minH="600px"
                      bg="white"
                    >
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
                        {!submissions?.length && !searchText && !isLoading ? (
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
                              {filterLabel
                                ? `Zero Results`
                                : 'People are working!'}
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
                          onClick={() =>
                            skip % length === 0 && setSkip(skip + length)
                          }
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
              </TabPanel>
              {bounty &&
                bounty.id &&
                bounty.isPublished &&
                !bounty.isWinnersAnnounced &&
                !isExpired && (
                  <TabPanel px={0}>
                    <ScoutTable
                      bountyId={bounty.id}
                      scouts={scouts}
                      setInvited={(userId: string) => {
                        const scout = scouts.find(
                          (scout) => scout.userId === userId,
                        );
                        if (!scout) return;
                        if (scout) {
                          scout.invited = true;
                        }
                        const scoutIndex = scouts.findIndex(
                          (scout) => scout.userId === userId,
                        );
                        if (scoutIndex > -1 && scoutIndex < scouts.length) {
                          const scoutsNew = [...scouts];
                          if (scoutsNew[scoutIndex]) {
                            scoutsNew[scoutIndex] = scout;
                          }
                          setScouts(scoutsNew);
                        }
                      }}
                    />
                  </TabPanel>
                )}
            </TabPanels>
          </Tabs>
        </>
      )}
    </SponsorLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug } = context.query;
  return {
    props: { slug },
  };
};

export default BountySubmissions;
