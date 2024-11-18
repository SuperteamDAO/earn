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
} from '@chakra-ui/react';
import { type SubmissionLabels } from '@prisma/client';
import { useQuery } from '@tanstack/react-query';
import { useSetAtom } from 'jotai';
import type { GetServerSideProps } from 'next';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/router';
import { usePostHog } from 'posthog-js/react';
import { useEffect, useMemo, useState } from 'react';

import { LoadingSection } from '@/components/shared/LoadingSection';
import { BONUS_REWARD_POSITION } from '@/constants';
import { PublishResults } from '@/features/listings';
import {
  selectedSubmissionAtom,
  sponsorDashboardListingQuery,
  SubmissionHeader,
  SubmissionList,
  SubmissionPanel,
  submissionsQuery,
} from '@/features/sponsor-dashboard';
import { useDisclosure } from '@/hooks/use-disclosure';
import type { SubmissionWithUser } from '@/interface/submission';
import { SponsorLayout } from '@/layouts/Sponsor';
import { useUser } from '@/store/user';
import { dayjs } from '@/utils/dayjs';
import { cleanRewards } from '@/utils/rank';

interface Props {
  listing: string;
}

const selectedStyles = {
  borderColor: 'brand.purple',
  color: 'brand.slate.600',
};

const submissionsPerPage = 10;

export default function BountySubmissions({ listing }: Props) {
  const router = useRouter();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { user } = useUser();
  const [currentPage, setCurrentPage] = useState(1);

  const setSelectedSubmission = useSetAtom(selectedSubmissionAtom);

  const [searchText, setSearchText] = useState('');

  const [remainings, setRemainings] = useState<{
    podiums: number;
    bonus: number;
  } | null>(null);
  const [filterLabel, setFilterLabel] = useState<
    SubmissionLabels | 'Winner' | 'Rejected' | undefined
  >(undefined);

  const searchParams = useSearchParams();
  const posthog = usePostHog();

  const { data: submissions, isLoading: isSubmissionsLoading } = useQuery(
    submissionsQuery(listing, true),
  );

  const { data: bounty, isLoading: isBountyLoading } = useQuery(
    sponsorDashboardListingQuery(listing, true),
  );

  const filteredSubmissions = useMemo(() => {
    if (!submissions) return [];
    return submissions.filter((submission: SubmissionWithUser) => {
      const firstName = submission.user.firstName?.toLowerCase() || '';
      const lastName = submission.user.lastName?.toLowerCase() || '';
      const fullName = `${firstName} ${lastName}`.trim();
      const email = submission.user.email?.toLowerCase() || '';
      const username = submission.user.username?.toLowerCase() || '';
      const twitter = submission.user.twitter?.toLowerCase() || '';
      const discord = submission.user.discord?.toLowerCase() || '';
      const link = submission.link?.toLowerCase() || '';

      const searchLower = searchText.toLowerCase();

      const matchesSearch =
        searchText === '' ||
        firstName.includes(searchLower) ||
        lastName.includes(searchLower) ||
        fullName.includes(searchLower) ||
        email.includes(searchLower) ||
        username.includes(searchLower) ||
        twitter.includes(searchLower) ||
        discord.includes(searchLower) ||
        link.includes(searchLower);

      const matchesLabel =
        !filterLabel ||
        (filterLabel === 'Winner'
          ? submission.isWinner
          : submission.label === filterLabel);

      return matchesSearch && matchesLabel;
    });
  }, [submissions, searchText, filterLabel]);

  useEffect(() => {
    if (filteredSubmissions && filteredSubmissions.length > 0) {
      setSelectedSubmission(filteredSubmissions[0]);
    }
  }, [filteredSubmissions]);

  useEffect(() => {
    if (bounty && user?.currentSponsorId) {
      // if (bounty?.hackathonId !== user.hackathonId) {
      //   router.push('/dashboard/hackathon');
      // }

      const podiumWinnersSelected = submissions?.filter(
        (submission) =>
          submission.isWinner &&
          submission.winnerPosition !== BONUS_REWARD_POSITION,
      ).length;

      const bonusWinnerSelected = submissions?.filter(
        (sub) => sub.isWinner && sub.winnerPosition === BONUS_REWARD_POSITION,
      ).length;

      const rewardsLength = cleanRewards(bounty.rewards, true).length;
      setRemainings({
        podiums: rewardsLength - (podiumWinnersSelected || 0),
        bonus: (bounty.maxBonusSpots || 0) - (bonusWinnerSelected || 0),
      });
    }
  }, [bounty, submissions, user?.currentSponsorId, router]);

  useEffect(() => {
    if (searchParams.has('scout')) posthog.capture('scout tab_scout');
  }, []);

  const paginatedSubmissions = useMemo(() => {
    const startIndex = (currentPage - 1) * submissionsPerPage;
    return filteredSubmissions.slice(
      startIndex,
      startIndex + submissionsPerPage,
    );
  }, [filteredSubmissions, currentPage]);

  const totalPages = Math.ceil(filteredSubmissions.length / submissionsPerPage);

  const usedPositions = submissions
    ?.filter((s: any) => s.isWinner)
    .map((s: any) => Number(s.winnerPosition))
    .filter((key: number) => !isNaN(key));

  const totalWinners = submissions?.filter((sub) => sub.isWinner).length;
  const totalPaymentsMade = submissions?.filter((sub) => sub.isPaid).length;

  const isExpired = dayjs(bounty?.deadline).isBefore(dayjs());

  const isSponsorVerified = bounty?.sponsor?.isVerified;

  return (
    <SponsorLayout isCollapsible={true}>
      {isBountyLoading || isSubmissionsLoading ? (
        <LoadingSection />
      ) : (
        <>
          {isOpen && (
            <PublishResults
              remainings={remainings}
              isOpen={isOpen}
              onClose={onClose}
              totalWinners={totalWinners || 0}
              totalPaymentsMade={totalPaymentsMade || 0}
              bounty={bounty}
              usedPositions={usedPositions || []}
              setRemainings={setRemainings}
              submissions={submissions || []}
            />
          )}
          <SubmissionHeader
            bounty={bounty}
            totalSubmissions={submissions?.length || 0}
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
                          listing={bounty}
                          filterLabel={filterLabel}
                          setFilterLabel={setFilterLabel}
                          submissions={paginatedSubmissions}
                          setSearchText={setSearchText}
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
                        {!paginatedSubmissions?.length &&
                        !searchText &&
                        !isSubmissionsLoading ? (
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
                          <SubmissionPanel
                            remainings={remainings}
                            setRemainings={setRemainings}
                            bounty={bounty}
                            submissions={paginatedSubmissions}
                            usedPositions={usedPositions || []}
                            onWinnersAnnounceOpen={onOpen}
                          />
                        )}
                      </GridItem>
                    </Grid>
                  </Flex>
                  <Flex align="center" justify="start" gap={4} mt={4}>
                    {!!searchText || !!filterLabel ? (
                      <Text color="brand.slate.400" fontSize="sm">
                        Found{' '}
                        <Text as="span" fontWeight={700}>
                          {filteredSubmissions.length}
                        </Text>{' '}
                        {filteredSubmissions.length === 1
                          ? 'result'
                          : 'results'}
                      </Text>
                    ) : (
                      <>
                        <Button
                          isDisabled={currentPage <= 1}
                          leftIcon={<ChevronLeftIcon w={5} h={5} />}
                          onClick={() =>
                            setCurrentPage((prev) => Math.max(prev - 1, 1))
                          }
                          size="sm"
                          variant="outline"
                        >
                          Previous
                        </Button>
                        <Text color="brand.slate.400" fontSize="sm">
                          <Text as="span" fontWeight={700}>
                            {(currentPage - 1) * submissionsPerPage + 1}
                          </Text>{' '}
                          -{' '}
                          <Text as="span" fontWeight={700}>
                            {Math.min(
                              currentPage * submissionsPerPage,
                              filteredSubmissions.length,
                            )}
                          </Text>{' '}
                          of{' '}
                          <Text as="span" fontWeight={700}>
                            {filteredSubmissions.length}
                          </Text>{' '}
                          Submissions
                        </Text>
                        <Button
                          isDisabled={currentPage >= totalPages}
                          onClick={() =>
                            setCurrentPage((prev) =>
                              Math.min(prev + 1, totalPages),
                            )
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
            </TabPanels>
          </Tabs>
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
