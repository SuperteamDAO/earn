import { type SubmissionLabels } from '@prisma/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAtom } from 'jotai';
import { Check } from 'lucide-react';
import type { GetServerSideProps } from 'next';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/router';
import { usePostHog } from 'posthog-js/react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { LoadingSection } from '@/components/shared/LoadingSection';
import { Button } from '@/components/ui/button';
import { ExternalImage } from '@/components/ui/cloudinary-image';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDisclosure } from '@/hooks/use-disclosure';
import type { SubmissionWithUser } from '@/interface/submission';
import { SponsorLayout } from '@/layouts/Sponsor';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';
import { dayjs } from '@/utils/dayjs';
import { cleanRewards } from '@/utils/rank';

import { BONUS_REWARD_POSITION } from '@/features/listing-builder/constants';
import {
  selectedSubmissionAtom,
  selectedSubmissionIdsAtom,
} from '@/features/sponsor-dashboard/atoms';
import { PublishResults } from '@/features/sponsor-dashboard/components/PublishResults';
import { ScoutTable } from '@/features/sponsor-dashboard/components/Scouts/ScoutTable';
import { MultiBonusModal } from '@/features/sponsor-dashboard/components/Submissions/Modals/MultiBonusModal';
import { RejectAllSubmissionModal } from '@/features/sponsor-dashboard/components/Submissions/Modals/RejectAllModal';
import { SubmissionHeader } from '@/features/sponsor-dashboard/components/Submissions/SubmissionHeader';
import { SubmissionList } from '@/features/sponsor-dashboard/components/Submissions/SubmissionList';
import { SubmissionPanel } from '@/features/sponsor-dashboard/components/Submissions/SubmissionPanel';
import { useRejectSubmissions } from '@/features/sponsor-dashboard/mutations/useRejectSubmissions';
import { useToggleWinner } from '@/features/sponsor-dashboard/mutations/useToggleWinner';
import { sponsorDashboardListingQuery } from '@/features/sponsor-dashboard/queries/listing';
import { scoutsQuery } from '@/features/sponsor-dashboard/queries/scouts';
import { submissionsQuery } from '@/features/sponsor-dashboard/queries/submissions';
import { type ScoutRowType } from '@/features/sponsor-dashboard/types';

interface Props {
  slug: string;
}

export default function BountySubmissions({ slug }: Props) {
  const router = useRouter();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { user } = useUser();

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

  useEffect(() => {
    const handleRouteChange = () => {
      setSelectedSubmissionIds(new Set());
    };

    router.events.on('routeChangeStart', handleRouteChange);

    return () => {
      router.events.off('routeChangeStart', handleRouteChange);
    };
  }, [router.events, setSelectedSubmissionIds]);

  const [isToggledAll, setIsToggledAll] = useState(false);
  const {
    isOpen: isTogglerOpen,
    onOpen: onTogglerOpen,
    onClose: onTogglerClose,
  } = useDisclosure();
  const {
    isOpen: multiActionConfrimIsOpen,
    onOpen: multiActionConfirmOnOpen,
    onClose: multiActionConfirmOnClose,
  } = useDisclosure();

  const { data: submissions, isLoading: isSubmissionsLoading } = useQuery(
    submissionsQuery(slug),
  );

  const { data: bounty, isLoading: isBountyLoading } = useQuery(
    sponsorDashboardListingQuery(slug),
  );

  const isProject = useMemo(() => bounty?.type === 'project', [bounty]);

  useEffect(() => {
    selectedSubmissionIds.size > 0 ? onTogglerOpen() : onTogglerClose();
  }, [selectedSubmissionIds]);

  useEffect(() => {
    const newSet = new Set(selectedSubmissionIds);
    Array.from(selectedSubmissionIds).forEach((a) => {
      const submissionWithId = submissions?.find(
        (submission) => submission.id === a,
      );
      if (
        submissionWithId &&
        (submissionWithId.status !== 'Pending' ||
          submissionWithId.winnerPosition)
      ) {
        newSet.delete(a);
      }
    });
    setSelectedSubmissionIds(newSet);
  }, [submissions]);

  const isAllCurrentToggled = () =>
    filteredSubmissions
      ?.filter(
        (submission) =>
          submission.status === 'Pending' && !submission.winnerPosition,
      )
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

  const { mutateAsync: toggleWinner } = useToggleWinner(bounty);

  const handleRejectSubmission = (submissionIds: string[]) => {
    rejectSubmissions.mutate(submissionIds);
    multiActionConfirmOnClose();
  };

  const handleAssignBonus = useCallback(
    async (submissionIds: string[]) => {
      try {
        const bonusSubmissions = submissionIds.map((s) => ({
          id: s,
          isWinner: true,
          winnerPosition: BONUS_REWARD_POSITION,
        }));

        await toggleWinner(bonusSubmissions);
        multiActionConfirmOnClose();
        setSelectedSubmissionIds(new Set());
      } catch (error) {
        console.error('Error assigning bonus:', error);
      }
    },
    [toggleWinner, multiActionConfirmOnClose, setSelectedSubmissionIds],
  );

  const isMultiSelectDisabled = useMemo(() => {
    if (bounty?.isWinnersAnnounced) return true;
    if (bounty?.type === 'project') return false;
    else {
      if (!bounty?.rewards?.[BONUS_REWARD_POSITION] || !bounty?.maxBonusSpots)
        return true;
    }
    if (remainings?.bonus === 0) return true;
    return false;
  }, [bounty, selectedSubmissionIds, remainings]);

  const multiBonusPodiumsOverSelected = useMemo(
    () =>
      Boolean(
        bounty?.type !== 'project' &&
          bounty?.rewards?.[BONUS_REWARD_POSITION] &&
          bounty?.maxBonusSpots &&
          remainings &&
          selectedSubmissionIds.size > remainings.bonus,
      ),
    [bounty, selectedSubmissionIds, remainings],
  );

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
        bonus:
          (!!bounty?.rewards?.[BONUS_REWARD_POSITION]
            ? bounty.maxBonusSpots || 0
            : 0) - (bonusWinnerSelected || 0),
      });
    }
  }, [bounty, submissions, user?.currentSponsorId, router]);

  useEffect(() => {
    if (searchParams?.has('scout')) posthog.capture('scout tab_scout');
  }, []);

  useEffect(() => {
    setIsToggledAll(isAllCurrentToggled());
  }, [selectedSubmissionIds, filteredSubmissions]);

  const toggleAllSubmissions = () => {
    if (!isAllCurrentToggled()) {
      setSelectedSubmissionIds((prev) => {
        const newSet = new Set(prev);
        filteredSubmissions
          ?.filter(
            (submission) =>
              submission.status === 'Pending' && !submission.winnerPosition,
          )
          .map((submission) => newSet.add(submission.id));
        return newSet;
      });
    } else {
      setSelectedSubmissionIds((prev) => {
        const newSet = new Set(prev);
        filteredSubmissions?.map((submission) => newSet.delete(submission.id));
        return newSet;
      });
    }
  };

  const usedPositions = submissions
    ?.filter((s: any) => s.isWinner)
    .map((s: any) => Number(s.winnerPosition))
    .filter((key: number) => !isNaN(key));

  const totalWinners = submissions?.filter((sub) => sub.isWinner).length;
  const totalPaymentsMade = submissions?.filter((sub) => sub.isPaid).length;

  const isExpired = dayjs(bounty?.deadline).isBefore(dayjs());

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!filteredSubmissions.length) return;

      const currentIndex = filteredSubmissions.findIndex(
        (sub) => sub.id === selectedSubmission?.id,
      );

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          if (currentIndex > 0) {
            setSelectedSubmission(filteredSubmissions[currentIndex - 1]);
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (currentIndex < filteredSubmissions.length - 1) {
            setSelectedSubmission(filteredSubmissions[currentIndex + 1]);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredSubmissions, selectedSubmission, setSelectedSubmission]);

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
              submissionsLeft={
                submissions?.filter((s) => !s.isWinner).length || 0
              }
              submissions={submissions || []}
            />
          )}
          <SubmissionHeader bounty={bounty} />
          <Tabs
            defaultValue={searchParams?.has('scout') ? 'scout' : 'submissions'}
          >
            {bounty?.isPublished && (
              <>
                <TabsList className="mt-3 gap-4 font-medium text-slate-400">
                  <TabsTrigger value="submissions">
                    Submissions
                    <div className="text-xxs ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-slate-500">
                      {submissions?.length}
                    </div>
                  </TabsTrigger>
                  {!bounty?.isWinnersAnnounced && !isExpired && (
                    <TabsTrigger
                      value="scout"
                      className={cn('ph-no-capture')}
                      onClick={() => posthog.capture('scout tab_scout')}
                    >
                      Scout Talent
                      <div className="ml-1.5 h-1.5 w-1.5 rounded-full bg-red-500" />
                    </TabsTrigger>
                  )}
                  {bounty?.isWinnersAnnounced && (
                    <TabsTrigger value="submissions">Payments</TabsTrigger>
                  )}
                </TabsList>
                <div className="h-[1.5px] w-full bg-slate-200/70" />
              </>
            )}

            <TabsContent value="submissions" className="w-full px-0">
              <div className="grid h-[40rem] w-full grid-cols-[23rem_1fr] bg-white">
                <SubmissionList
                  listing={bounty}
                  setFilterLabel={setFilterLabel}
                  submissions={filteredSubmissions}
                  setSearchText={setSearchText}
                  type={bounty?.type}
                  isToggled={isToggled}
                  toggleSubmission={toggleSubmission}
                  isAllToggled={isToggledAll}
                  toggleAllSubmissions={toggleAllSubmissions}
                  isMultiSelectDisabled={isMultiSelectDisabled}
                />

                <div className="h-full w-full rounded-r-xl border-t border-r border-b border-slate-200 bg-white">
                  {!filteredSubmissions?.length &&
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
                      bounty={bounty}
                      submissions={filteredSubmissions}
                      usedPositions={usedPositions || []}
                      onWinnersAnnounceOpen={onOpen}
                    />
                  )}
                </div>
              </div>

              {(!!searchText || !!filterLabel) && (
                <div className="mt-4 flex items-center justify-start gap-4">
                  <p className="text-sm text-slate-400">
                    Found{' '}
                    <span className="font-bold">
                      {filteredSubmissions.length}
                    </span>{' '}
                    {filteredSubmissions.length === 1 ? 'result' : 'results'}
                  </p>
                </div>
              )}
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

          <Dialog
            modal={false}
            onOpenChange={onTogglerClose}
            open={isTogglerOpen}
          >
            <DialogContent
              onEscapeKeyDown={(e) => e.preventDefault()}
              onInteractOutside={(e) => e.preventDefault()}
              classNames={{
                overlay: 'hidden',
              }}
              unsetDefaultPosition
              hideCloseIcon
              className="fixed bottom-4 left-1/2 w-fit max-w-none -translate-x-1/2 overflow-hidden px-1 py-1"
            >
              <div className="mx-auto w-fit rounded-lg">
                {multiBonusPodiumsOverSelected && (
                  <p className="pb-2 text-center text-sm text-red-500">
                    You have {remainings?.bonus || 0} bonus spots available
                  </p>
                )}
                <div className="flex items-center gap-4 text-lg">
                  <div className="flex items-center gap-2 px-2 pl-4 font-medium">
                    <p>{selectedSubmissionIds.size}</p>
                    <p className="text-slate-500">Selected</p>
                  </div>

                  <div className="h-4 w-px bg-slate-300" />

                  <Button
                    className="px-2 font-medium"
                    onClick={() => {
                      setSelectedSubmissionIds(new Set());
                    }}
                    variant="ghost"
                  >
                    UNSELECT ALL
                  </Button>

                  <Button
                    className={cn(
                      'gap-2 px-2 font-medium',
                      isProject &&
                        'bg-red-100 text-rose-600 hover:bg-red-50/90',
                      !isProject &&
                        'bg-green-100 text-emerald-600 hover:bg-green-50/90',
                    )}
                    disabled={
                      selectedSubmissionIds.size === 0 ||
                      multiBonusPodiumsOverSelected
                    }
                    onClick={multiActionConfirmOnOpen}
                  >
                    {isProject && (
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
                    )}
                    {!isProject && (
                      <span className="flex items-center justify-between rounded-full bg-green-600 p-[3px]">
                        <Check className="!size-2.5 stroke-3 text-white" />
                      </span>
                    )}
                    {isProject ? `Reject` : 'Assign'}{' '}
                    {selectedSubmissionIds.size}{' '}
                    {isProject ? 'Application' : 'Bonus'}
                    {selectedSubmissionIds.size > 1
                      ? isProject
                        ? 's'
                        : 'es'
                      : ''}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          {isProject && (
            <RejectAllSubmissionModal
              allSubmissionsLength={submissions?.length || 0}
              submissionIds={Array.from(selectedSubmissionIds)}
              rejectIsOpen={multiActionConfrimIsOpen}
              rejectOnClose={multiActionConfirmOnClose}
              onRejectSubmission={handleRejectSubmission}
            />
          )}
          {!isProject && (
            <MultiBonusModal
              allSubmissionsLength={submissions?.length || 0}
              submissionIds={Array.from(selectedSubmissionIds)}
              bonusIsOpen={multiActionConfrimIsOpen}
              bonusOnClose={multiActionConfirmOnClose}
              onBonusSubmission={handleAssignBonus}
            />
          )}
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
