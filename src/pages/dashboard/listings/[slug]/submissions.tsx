import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  Flex,
  Grid,
  GridItem,
  HStack,
  Image,
  Popover,
  PopoverBody,
  PopoverContent,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  Tooltip,
} from '@chakra-ui/react';
import { type SubmissionLabels } from '@prisma/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAtom } from 'jotai';
import type { GetServerSideProps } from 'next';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/router';
import { usePostHog } from 'posthog-js/react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { LoadingSection } from '@/components/shared/LoadingSection';
import { BONUS_REWARD_POSITION } from '@/constants';
import { PublishResults } from '@/features/listings';
import {
  RejectAllSubmissionModal,
  type ScoutRowType,
  scoutsQuery,
  ScoutTable,
  selectedSubmissionAtom,
  selectedSubmissionIdsAtom,
  sponsorDashboardListingQuery,
  SubmissionHeader,
  SubmissionList,
  SubmissionPanel,
  submissionsQuery,
  useRejectSubmissions,
} from '@/features/sponsor-dashboard';
import { useDisclosure } from '@/hooks/use-disclosure';
import type { SubmissionWithUser } from '@/interface/submission';
import { SponsorLayout } from '@/layouts/Sponsor';
import { useUser } from '@/store/user';
import { dayjs } from '@/utils/dayjs';
import { cleanRewards } from '@/utils/rank';

interface Props {
  slug: string;
}

const selectedStyles = {
  borderColor: 'brand.purple',
  color: 'brand.slate.600',
};

const submissionsPerPage = 10;

export default function BountySubmissions({ slug }: Props) {
  const router = useRouter();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { user } = useUser();
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedSubmission, setSelectedSubmission] = useAtom(
    selectedSubmissionAtom,
  );

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
  const queryClient = useQueryClient();

  const [selectedSubmissionIds, setSelectedSubmissionIds] = useAtom(
    selectedSubmissionIdsAtom,
  );

  const [isToggledAll, setIsToggledAll] = useState(false);
  const {
    isOpen: isTogglerOpen,
    onOpen: onTogglerOpen,
    onClose: onTogglerClose,
  } = useDisclosure();
  const {
    isOpen: rejectedIsOpen,
    onOpen: rejectedOnOpen,
    onClose: rejectedOnClose,
  } = useDisclosure();

  const { data: submissions, isLoading: isSubmissionsLoading } = useQuery(
    submissionsQuery(slug),
  );

  const { data: bounty, isLoading: isBountyLoading } = useQuery(
    sponsorDashboardListingQuery(slug),
  );

  useEffect(() => {
    selectedSubmissionIds.size > 0 ? onTogglerOpen() : onTogglerClose();
  }, [selectedSubmissionIds]);

  useEffect(() => {
    const newSet = new Set(selectedSubmissionIds);
    Array.from(selectedSubmissionIds).forEach((a) => {
      const submissionWithId = submissions?.find(
        (submission) => submission.id === a,
      );
      if (submissionWithId && submissionWithId.status !== 'Pending') {
        newSet.delete(a);
      }
    });
    setSelectedSubmissionIds(newSet);
  }, [submissions]);

  const isAllCurrentToggled = () =>
    paginatedSubmissions
      ?.filter((submission) => submission.status === 'Pending')
      .every((submission) => selectedSubmissionIds.has(submission.id)) || false;

  const toggleSubmission = (id: string) => {
    setSelectedSubmissionIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
        return newSet;
      } else {
        return newSet.add(id);
      }
    });
  };

  const isToggled = useCallback(
    (id: string) => {
      return selectedSubmissionIds.has(id);
    },
    [selectedSubmissionIds, submissions],
  );

  const rejectSubmissions = useRejectSubmissions(slug);

  const handleRejectSubmission = (submissionIds: string[]) => {
    rejectSubmissions.mutate(submissionIds);
    rejectedOnClose();
  };

  const { data: scouts } = useQuery({
    ...scoutsQuery({
      bountyId: bounty?.id!,
    }),
    enabled: !!(
      !!bounty?.id &&
      bounty.isPublished &&
      !bounty.isWinnersAnnounced
    ),
  });

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

      let matchesLabel = false;

      if (!filterLabel) {
        matchesLabel = true;
      } else if (filterLabel === 'Winner') {
        matchesLabel = submission.isWinner;
      } else if (filterLabel === 'Rejected') {
        matchesLabel = submission.status === 'Rejected';
      } else {
        matchesLabel = submission.label === filterLabel;
      }

      return matchesSearch && matchesLabel;
    });
  }, [submissions, searchText, filterLabel]);

  useEffect(() => {
    if (filteredSubmissions && filteredSubmissions.length > 0) {
      setSelectedSubmission((selectedSubmission) => {
        if (filteredSubmissions.find((f) => f.id === selectedSubmission?.id)) {
          return selectedSubmission;
        }
        return filteredSubmissions[0];
      });
    }
  }, [filteredSubmissions]);

  useEffect(() => {
    if (bounty && user?.currentSponsorId) {
      if (bounty.sponsorId !== user.currentSponsorId) {
        router.push('/dashboard/listings');
      }

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

  useEffect(() => {
    setIsToggledAll(isAllCurrentToggled());
  }, [selectedSubmissionIds, paginatedSubmissions]);

  const toggleAllSubmissions = () => {
    if (!isAllCurrentToggled()) {
      setSelectedSubmissionIds((prev) => {
        const newSet = new Set(prev);
        paginatedSubmissions
          ?.filter((submission) => submission.status === 'Pending')
          .map((submission) => newSet.add(submission.id));
        return newSet;
      });
    } else {
      setSelectedSubmissionIds((prev) => {
        const newSet = new Set(prev);
        paginatedSubmissions?.map((submission) => newSet.delete(submission.id));
        return newSet;
      });
    }
  };

  const totalPages = Math.ceil(filteredSubmissions.length / submissionsPerPage);

  const usedPositions = submissions
    ?.filter((s: any) => s.isWinner)
    .map((s: any) => Number(s.winnerPosition))
    .filter((key: number) => !isNaN(key));

  const totalWinners = submissions?.filter((sub) => sub.isWinner).length;
  const totalPaymentsMade = submissions?.filter((sub) => sub.isPaid).length;

  const isExpired = dayjs(bounty?.deadline).isBefore(dayjs());

  const isSponsorVerified = bounty?.sponsor?.isVerified;

  const [pageSelections, setPageSelections] = useState<Record<number, string>>(
    {},
  );

  useEffect(() => {
    if (selectedSubmission) {
      setPageSelections((prev) => ({
        ...prev,
        [currentPage]: selectedSubmission.id,
      }));
    }
  }, [selectedSubmission, currentPage]);

  useEffect(() => {
    if (paginatedSubmissions.length > 0) {
      const savedSelectionId = pageSelections[currentPage];
      const submissionToSelect = paginatedSubmissions.find(
        (sub) => sub.id === savedSelectionId,
      );

      if (
        submissionToSelect &&
        submissionToSelect.id !== selectedSubmission?.id
      ) {
        setSelectedSubmission(submissionToSelect);
      } else if (
        !submissionToSelect &&
        (!selectedSubmission ||
          !paginatedSubmissions.some((sub) => sub.id === selectedSubmission.id))
      ) {
        setSelectedSubmission(paginatedSubmissions[0]);
      }
    }
  }, [currentPage, paginatedSubmissions, pageSelections]);

  const changePage = useCallback(
    async (newPage: number, selectIndex: number) => {
      if (newPage < 1 || newPage > totalPages) return;

      setCurrentPage(newPage);
      await new Promise((resolve) => setTimeout(resolve, 0));

      const newPaginatedSubmissions = filteredSubmissions.slice(
        (newPage - 1) * submissionsPerPage,
        newPage * submissionsPerPage,
      );

      const submissionToSelect = newPaginatedSubmissions[selectIndex];
      if (submissionToSelect) {
        setSelectedSubmission(submissionToSelect);
      }
    },
    [
      filteredSubmissions,
      submissionsPerPage,
      totalPages,
      setSelectedSubmission,
    ],
  );

  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (!filteredSubmissions.length) return;

      const currentIndex = paginatedSubmissions.findIndex(
        (sub) => sub.id === selectedSubmission?.id,
      );

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          if (currentIndex > 0) {
            setSelectedSubmission(paginatedSubmissions[currentIndex - 1]);
          } else if (currentPage > 1) {
            await changePage(currentPage - 1, submissionsPerPage - 1);
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (currentIndex < paginatedSubmissions.length - 1) {
            setSelectedSubmission(paginatedSubmissions[currentIndex + 1]);
          } else if (currentPage < totalPages) {
            await changePage(currentPage + 1, 0);
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (currentPage > 1) {
            const savedSelectionIndex = pageSelections[currentPage - 1]
              ? paginatedSubmissions.findIndex(
                  (sub) => sub.id === pageSelections[currentPage - 1],
                )
              : 0;
            await changePage(currentPage - 1, savedSelectionIndex);
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (currentPage < totalPages) {
            const savedSelectionIndex = pageSelections[currentPage + 1]
              ? paginatedSubmissions.findIndex(
                  (sub) => sub.id === pageSelections[currentPage + 1],
                )
              : 0;
            await changePage(currentPage + 1, savedSelectionIndex);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    filteredSubmissions,
    paginatedSubmissions,
    selectedSubmission,
    currentPage,
    totalPages,
    pageSelections,
    setSelectedSubmission,
    changePage,
    submissionsPerPage,
  ]);

  return (
    <SponsorLayout isCollapsible>
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
                          isToggled={isToggled}
                          toggleSubmission={toggleSubmission}
                          isAllToggled={isToggledAll}
                          toggleAllSubmissions={toggleAllSubmissions}
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
                            isMultiSelectOn={selectedSubmissionIds.size > 0}
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
              {bounty &&
                bounty.id &&
                bounty.isPublished &&
                !bounty.isWinnersAnnounced &&
                !isExpired && (
                  <TabPanel px={0}>
                    <ScoutTable
                      bountyId={bounty.id}
                      scouts={scouts || []}
                      setInvited={(userId: string) => {
                        queryClient.setQueryData(
                          ['scouts', bounty.id],
                          (oldData: ScoutRowType[] | undefined) => {
                            if (!oldData) return oldData;
                            return oldData.map((scout) =>
                              scout.userId === userId
                                ? { ...scout, invited: true }
                                : scout,
                            );
                          },
                        );
                      }}
                    />
                  </TabPanel>
                )}
            </TabPanels>
          </Tabs>
          <Popover
            closeOnBlur={false}
            closeOnEsc={false}
            isOpen={isTogglerOpen}
            onClose={onTogglerClose}
          >
            <PopoverContent
              pos="fixed"
              bottom={10}
              w="full"
              mx="auto"
              p={0}
              bg="transparent"
              border="none"
              shadow="none"
            >
              <PopoverBody
                w="fit-content"
                mx="auto"
                px={4}
                bg="white"
                borderWidth={2}
                borderColor="brand.slate.200"
                shadow="lg"
                rounded={'lg'}
              >
                {selectedSubmissionIds.size > 100 && (
                  <Text pb={2} color="red" textAlign="center">
                    Cannot select more than 100 applications
                  </Text>
                )}
                <HStack gap={4} fontSize={'lg'}>
                  <HStack fontWeight={500}>
                    <Text>{selectedSubmissionIds.size}</Text>
                    <Text color="brand.slate.500">Selected</Text>
                  </HStack>
                  <Box w="1px" h={4} bg="brand.slate.300" />
                  <Button
                    fontWeight={500}
                    bg="transparent"
                    onClick={() => {
                      setSelectedSubmissionIds(new Set());
                    }}
                    variant="link"
                  >
                    UNSELECT ALL
                  </Button>
                  <Button
                    gap={2}
                    color="#E11D48"
                    fontWeight={500}
                    bg="#FEF2F2"
                    isDisabled={
                      selectedSubmissionIds.size === 0 ||
                      selectedSubmissionIds.size > 100
                    }
                    onClick={rejectedOnOpen}
                  >
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 13 13"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M6.11111 0.777832C9.49056 0.777832 12.2222 3.5095 12.2222 6.88894C12.2222 10.2684 9.49056 13.0001 6.11111 13.0001C2.73167 13.0001 0 10.2684 0 6.88894C0 3.5095 2.73167 0.777832 6.11111 0.777832ZM8.305 3.83339L6.11111 6.02728L3.91722 3.83339L3.05556 4.69505L5.24944 6.88894L3.05556 9.08283L3.91722 9.9445L6.11111 7.75061L8.305 9.9445L9.16667 9.08283L6.97278 6.88894L9.16667 4.69505L8.305 3.83339Z"
                        fill="#E11D48"
                      />
                    </svg>
                    Reject {selectedSubmissionIds.size} Applications
                  </Button>
                </HStack>
              </PopoverBody>
            </PopoverContent>
          </Popover>
          <RejectAllSubmissionModal
            allSubmissionsLength={submissions?.length || 0}
            submissionIds={Array.from(selectedSubmissionIds)}
            rejectIsOpen={rejectedIsOpen}
            rejectOnClose={rejectedOnClose}
            onRejectSubmission={handleRejectSubmission}
          />
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
