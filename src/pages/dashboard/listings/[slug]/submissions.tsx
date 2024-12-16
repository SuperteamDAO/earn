import { type SubmissionLabels } from '@prisma/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAtom } from 'jotai';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { GetServerSideProps } from 'next';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/router';
import { usePostHog } from 'posthog-js/react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { LoadingSection } from '@/components/shared/LoadingSection';
import { Button } from '@/components/ui/button';
import { ExternalImage } from '@/components/ui/cloudinary-image';
import { Popover, PopoverContent } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip } from '@/components/ui/tooltip';
import { BONUS_REWARD_POSITION } from '@/features/listing-builder';
import {
  PublishResults,
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
import { cn } from '@/utils';
import { dayjs } from '@/utils/dayjs';
import { cleanRewards } from '@/utils/rank';

interface Props {
  slug: string;
}

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
          <Tabs
            defaultValue={searchParams.has('scout') ? 'scout' : 'submissions'}
          >
            {bounty?.isPublished &&
              !bounty?.isWinnersAnnounced &&
              !isExpired && (
                <>
                  <TabsList className="gap-4 font-medium text-slate-400">
                    <TabsTrigger value="submissions">Submissions</TabsTrigger>
                    <Tooltip
                      content="Scout is an invite-only feature right now"
                      contentProps={{
                        className: 'rounded-lg px-4 py-2 font-sans',
                      }}
                      disabled={isSponsorVerified === true}
                    >
                      <TabsTrigger
                        value="scout"
                        className={cn(
                          'ph-no-capture',
                          !isSponsorVerified &&
                            'cursor-not-allowed text-slate-400',
                        )}
                        disabled={!isSponsorVerified}
                        onClick={() => posthog.capture('scout tab_scout')}
                      >
                        Scout Talent
                        {!!isSponsorVerified && (
                          <div className="ml-1.5 h-1.5 w-1.5 rounded-full bg-red-500" />
                        )}
                      </TabsTrigger>
                    </Tooltip>
                  </TabsList>
                  <div className="h-0.5 w-full bg-slate-200" />
                </>
              )}

            <TabsContent value="submissions" className="w-full px-0">
              <div className="flex w-full items-start bg-white">
                <div className="grid min-h-[600px] w-full grid-cols-[23rem_1fr] bg-white">
                  <div className="h-full w-full">
                    <SubmissionList
                      listing={bounty}
                      filterLabel={filterLabel}
                      setFilterLabel={(e) => {
                        setFilterLabel(e);
                        setCurrentPage(1);
                      }}
                      submissions={paginatedSubmissions}
                      setSearchText={(e) => {
                        setSearchText(e);
                        setCurrentPage(1);
                      }}
                      type={bounty?.type}
                      isToggled={isToggled}
                      toggleSubmission={toggleSubmission}
                      isAllToggled={isToggledAll}
                      toggleAllSubmissions={toggleAllSubmissions}
                    />
                  </div>

                  <div className="h-full w-full rounded-r-xl border-b border-r border-t border-slate-200 bg-white">
                    {!paginatedSubmissions?.length &&
                    !searchText &&
                    !isSubmissionsLoading ? (
                      <>
                        <ExternalImage
                          className="mx-auto mt-32 w-32"
                          alt={'talent empty'}
                          src={'/bg/talent-empty.svg'}
                        />
                        <p className="mx-auto mt-5 text-center text-lg font-semibold text-slate-600">
                          {filterLabel ? 'Zero Results' : 'People are working!'}
                        </p>
                        <p className="mx-auto mb-[200px] text-center font-medium text-slate-400">
                          {filterLabel
                            ? 'For the filters you have selected'
                            : 'Submissions will start appearing here'}
                        </p>
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
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-start gap-4">
                <>
                  <Button
                    disabled={currentPage <= 1}
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    size="sm"
                    variant="outline"
                  >
                    <ChevronLeft className="mr-2 h-5 w-5" />
                    Previous
                  </Button>

                  <p className="text-sm text-slate-400">
                    <span className="font-bold">
                      {(currentPage - 1) * submissionsPerPage + 1}
                    </span>{' '}
                    -{' '}
                    <span className="font-bold">
                      {Math.min(
                        currentPage * submissionsPerPage,
                        filteredSubmissions.length,
                      )}
                    </span>{' '}
                    of{' '}
                    <span className="font-bold">
                      {filteredSubmissions.length}
                    </span>{' '}
                    Submissions
                  </p>

                  <Button
                    disabled={currentPage >= totalPages}
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    size="sm"
                    variant="outline"
                  >
                    Next
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                </>
              </div>
            </TabsContent>

            {bounty &&
              bounty.id &&
              bounty.isPublished &&
              !bounty.isWinnersAnnounced &&
              !isExpired && (
                <TabsContent value="scout" className="px-0">
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
                </TabsContent>
              )}
          </Tabs>

          <Popover
            modal={true}
            onOpenChange={onTogglerClose}
            open={isTogglerOpen}
          >
            <PopoverContent
              className="fixed bottom-10 mx-auto w-full border-none bg-transparent p-0 shadow-none"
              align="center"
            >
              <div className="mx-auto w-fit rounded-lg border-2 border-slate-200 bg-white px-4 shadow-lg">
                {selectedSubmissionIds.size > 100 && (
                  <p className="pb-2 text-center text-red-500">
                    Cannot select more than 100 applications
                  </p>
                )}

                <div className="flex items-center gap-4 text-lg">
                  <div className="flex items-center gap-2 font-medium">
                    <p>{selectedSubmissionIds.size}</p>
                    <p className="text-slate-500">Selected</p>
                  </div>

                  <div className="h-4 w-px bg-slate-300" />

                  <Button
                    className="bg-transparent font-medium hover:bg-transparent"
                    onClick={() => {
                      setSelectedSubmissionIds(new Set());
                    }}
                    variant="ghost"
                  >
                    UNSELECT ALL
                  </Button>

                  <Button
                    className="gap-2 bg-red-100 font-medium text-rose-600 hover:bg-red-50/90"
                    disabled={
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
                </div>
              </div>
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
