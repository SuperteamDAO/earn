import { type SubmissionLabels } from '@prisma/client';
import { useQuery } from '@tanstack/react-query';
import { useSetAtom } from 'jotai';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { GetServerSideProps } from 'next';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/router';
import { usePostHog } from 'posthog-js/react';
import { useEffect, useMemo, useState } from 'react';

import { LoadingSection } from '@/components/shared/LoadingSection';
import { Button } from '@/components/ui/button';
import { ExternalImage } from '@/components/ui/cloudinary-image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { BONUS_REWARD_POSITION } from '@/constants';
import {
  PublishResults,
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
import { cn } from '@/utils';
import { dayjs } from '@/utils/dayjs';
import { cleanRewards } from '@/utils/rank';

interface Props {
  listing: string;
}

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
    sponsorDashboardListingQuery(listing),
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
          <Tabs
            defaultValue={searchParams.has('scout') ? 'scout' : 'submissions'}
          >
            <TabsList className="gap-4 border-b font-medium text-slate-400">
              <TabsTrigger
                value="submissions"
                className="px-1 text-sm data-[state=active]:bg-brand-purple/10 data-[state=active]:text-brand-purple"
              >
                Submissions
              </TabsTrigger>

              {bounty?.isPublished &&
                !bounty?.isWinnersAnnounced &&
                !isExpired && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger
                        asChild
                        disabled={isSponsorVerified === true}
                      >
                        <TabsTrigger
                          value="scout"
                          className={cn(
                            'ph-no-capture px-1 text-sm',
                            'data-[state=active]:bg-brand-purple/10 data-[state=active]:text-brand-purple',
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
                      </TooltipTrigger>
                      <TooltipContent className="rounded-lg bg-white px-4 py-2 font-sans text-slate-500">
                        Scout is an invite-only feature right now
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
            </TabsList>

            <TabsContent value="submissions" className="w-full px-0">
              <div className="flex w-full items-start bg-white">
                <div className="grid min-h-[600px] w-full grid-cols-[23rem_1fr] bg-white">
                  <div className="h-full w-full">
                    <SubmissionList
                      listing={bounty}
                      filterLabel={filterLabel}
                      setFilterLabel={setFilterLabel}
                      submissions={paginatedSubmissions}
                      setSearchText={setSearchText}
                      type={bounty?.type}
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
                {!!searchText || !!filterLabel ? (
                  <p className="text-sm text-slate-400">
                    Found{' '}
                    <span className="font-bold">
                      {filteredSubmissions.length}
                    </span>{' '}
                    {filteredSubmissions.length === 1 ? 'result' : 'results'}
                  </p>
                ) : (
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
                )}
              </div>
            </TabsContent>
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
