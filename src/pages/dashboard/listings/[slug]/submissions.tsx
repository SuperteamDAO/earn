import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  Flex,
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
import { Sidebar } from '@/layouts/Sponsor';
import { userStore } from '@/store/user';
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
  const { userInfo } = userStore();
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
      if (bountyDetails.data.sponsorId !== userInfo?.currentSponsorId) {
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
    if (userInfo?.currentSponsorId) {
      getSubmissions();
    }
  }, [userInfo?.currentSponsorId, skip, searchText]);

  useEffect(() => {
    if (userInfo?.currentSponsorId) {
      getBounty();
    }
  }, [userInfo?.currentSponsorId]);

  useEffect(() => {
    if (searchParams.has('scout')) posthog.capture('scout tab_scout');
  }, []);

  const isSponsorVerified = bounty?.sponsor?.isVerified;

  return (
    <Sidebar>
      {isBountyLoading ? (
        <LoadingSection />
      ) : (
        <>
          {isOpen && (
            <PublishResults
              isOpen={isOpen}
              onClose={onClose}
              totalWinners={totalWinners}
              totalPaymentsMade={totalPaymentsMade}
              bounty={bounty}
            />
          )}
          <SubmissionHeader
            bounty={bounty}
            onOpen={onOpen}
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
              <TabPanel px={0}>
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
                      People are working!
                    </Text>
                    <Text
                      mx="auto"
                      mb={200}
                      color={'brand.slate.400'}
                      fontWeight={500}
                      textAlign={'center'}
                    >
                      Submissions will start appearing here
                    </Text>
                  </>
                ) : (
                  <>
                    <Flex align={'start'} bg="white">
                      <Flex flex="4 1 auto" minH="600px">
                        <SubmissionList
                          submissions={submissions}
                          setSearchText={setSearchText}
                          selectedSubmission={selectedSubmission}
                          setSelectedSubmission={setSelectedSubmission}
                          type={bounty?.type}
                        />
                        <SubmissionDetails
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
                        />
                      </Flex>
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
                              skip >= length
                                ? setSkip(skip - length)
                                : setSkip(0)
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
                )}
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
    </Sidebar>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug } = context.query;
  return {
    props: { slug },
  };
};

export default BountySubmissions;
