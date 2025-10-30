import { useQuery } from '@tanstack/react-query';
import { Check, InfoIcon, ScanText, Wand2, XCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import posthog from 'posthog-js';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { AnimateChangeInHeight } from '@/components/shared/AnimateChangeInHeight';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Tooltip } from '@/components/ui/tooltip';
import { type SubmissionWithUser } from '@/interface/submission';
import { useUser } from '@/store/user';
import { WandAnimated } from '@/svg/WandAnimated/WandAnimated';

import {
  type BountiesAi,
  type BountySubmissionAi,
  type Listing,
} from '@/features/listings/types';
import { useCommitReviewsSubmissions } from '@/features/sponsor-dashboard/mutations/useCommitReviewsSubmissions';
import { unreviewedSubmissionsQuery } from '@/features/sponsor-dashboard/queries/unreviewed-submissions';

import { ReviewLoadingAnimation } from './ReviewLoadingAnimation';

interface Props {
  submissions: SubmissionWithUser[] | undefined;
  listing: Listing | undefined;
}
export default function AiReviewBountiesSubmissionsModal({
  submissions,
  listing,
}: Props) {
  const [open, setOpen] = useState(false);
  const [tooltipOpen, setTooltipOpen] = useState(true);
  const [state, setState] = useState<
    'DISCLAIMER' | 'INIT' | 'PROCESSING' | 'DONE' | 'ERROR'
  >('DISCLAIMER');
  const [progress, setProgress] = useState(0);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { user } = useUser();

  useEffect(() => {
    if (state !== 'PROCESSING') {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      return;
    }

    setProgress(0);
    let currentProgress = 0;

    progressIntervalRef.current = setInterval(() => {
      currentProgress += Math.random() * 15 + 6;
      const cappedProgress = Math.min(currentProgress, 99);
      setProgress(cappedProgress);

      if (cappedProgress >= 99) {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
      }
    }, 400);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, [state]);

  const [completedStats, setCompletedStats] = useState({
    totalReviewed: 0,
    shortlisted: 0,
    midQuality: 0,
    lowQuality: 0,
    inaccessible: 0,
    needsReview: 0,
    totalHoursSaved: 0,
  });

  const { data: unreviewedSubmissions, refetch: refetchUnreviewedSubmissions } =
    useQuery({
      ...unreviewedSubmissionsQuery(
        {
          id: listing?.id,
          evaluationCompleted: (listing?.ai as unknown as BountiesAi)
            ?.evaluationCompleted,
        },
        listing?.slug,
        !!listing &&
          !!user?.currentSponsorId &&
          user?.currentSponsorId === listing?.sponsorId,
      ),
      enabled:
        !!listing &&
        listing.type === 'bounty' &&
        !!user?.currentSponsorId &&
        user?.currentSponsorId === listing?.sponsorId &&
        (listing?.ai as unknown as BountiesAi)?.evaluationCompleted,
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
      retry: false,
    });

  useEffect(() => {
    if (
      !!listing &&
      listing.type === 'bounty' &&
      !!user?.currentSponsorId &&
      user?.currentSponsorId === listing?.sponsorId &&
      (listing?.ai as unknown as BountiesAi)?.evaluationCompleted
    ) {
      refetchUnreviewedSubmissions();
    }
  }, [
    submissions,
    refetchUnreviewedSubmissions,
    listing,
    user?.currentSponsorId,
  ]);

  const { mutateAsync: commitReviews } = useCommitReviewsSubmissions(
    listing?.slug || '',
    listing?.id || '',
  );

  const nonAnalysedSubmissions = useMemo(() => {
    console.log('unreviewedSubmissions', unreviewedSubmissions);
    return unreviewedSubmissions?.filter(
      (appl) => !(appl.ai as BountySubmissionAi)?.evaluation,
    );
  }, [unreviewedSubmissions]);

  const totalSubmissions = useMemo(() => {
    return unreviewedSubmissions?.length;
  }, [unreviewedSubmissions]);

  const estimatedTime = useMemo(() => {
    return estimateTime(nonAnalysedSubmissions?.length || 1);
  }, [nonAnalysedSubmissions?.length]);

  const [estimatedTimeSingular] = useState('~30 seconds');
  useMemo(() => {
    return estimateTime(nonAnalysedSubmissions?.length || 1, true);
  }, [nonAnalysedSubmissions?.length]);

  const onReviewClick = useCallback(async () => {
    posthog.capture('start_ai review bounties');
    setState('PROCESSING');

    setTimeout(async () => {
      setProgress(100);
      try {
        console.log('Commiting Reviewed submissions');
        const data = await commitReviews();
        console.log('commit data - ', data.data);
        setCompletedStats({
          totalReviewed: data.data.length,
          shortlisted: data.data.filter((s) => s.label === 'Shortlisted')
            .length,
          midQuality: data.data.filter((s) => s.label === 'Mid_Quality').length,
          lowQuality: data.data.filter((s) => s.label === 'Low_Quality').length,
          inaccessible: data.data.filter((s) => s.label === 'Inaccessible')
            .length,
          needsReview: data.data.filter((s) => s.label === 'Needs_Review')
            .length,
          totalHoursSaved: data.data.length * 6_00_000,
        });
        posthog.capture('complete_ai review bounties');
        setState('DONE');
        await refetchUnreviewedSubmissions();
      } catch (error: any) {
        console.log(
          'error occured while commiting reviewed submissions',
          error,
        );
        setState('ERROR');
      }
    }, 10000);
  }, [submissions, unreviewedSubmissions, nonAnalysedSubmissions, posthog]);
  function onComplete() {
    setState('DISCLAIMER');
    setProgress(0);
    setOpen(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(s) => {
        if (state === 'PROCESSING') return;
        if (s === false) posthog.capture('close_ai review bounties');
        if (s === true) setTooltipOpen(false);
        setOpen(s);
      }}
    >
      {!!listing?.isActive &&
        !listing?.isArchived &&
        listing?.type === 'bounty' &&
        !listing?.isWinnersAnnounced &&
        listing?.isPublished &&
        !!listing?.ai?.context &&
        !!unreviewedSubmissions?.length &&
        !!(listing?.ai as BountiesAi)?.evaluationCompleted && (
          <Tooltip
            open={tooltipOpen}
            showArrow
            content="Save hours by reviewing with AI"
            contentProps={{
              sideOffset: -4,
              className: 'bg-black text-white border-none rounded-[0.5rem]',
            }}
            arrowProps={{
              className: 'fill-black stroke-black',
            }}
          >
            <DialogTrigger asChild>
              <button
                className="h-10 min-w-max translate-y-2 focus:outline-none"
                onClick={() => {
                  posthog.capture('open_ai review bounties');
                }}
              >
                <div className="relative flex h-full items-center gap-3 overflow-hidden rounded-[0.5rem] border-[0.09375rem] border-indigo-400 bg-indigo-50 px-4 text-sm text-indigo-600 focus:outline-hidden">
                  <WandAnimated
                    className="!size-4"
                    stickColor="bg-indigo-500"
                    starColor="bg-indigo-500"
                  />
                  Review with AI
                </div>
              </button>
            </DialogTrigger>
          </Tooltip>
        )}
      <DialogContent className="p-0 sm:max-w-md" hideCloseIcon>
        <Card className="border-0 shadow-none">
          {state !== 'DISCLAIMER' && (
            <CardHeader className="flex flex-row items-center justify-between border-b p-0 px-6 py-3">
              <DialogTitle className="text-xl font-semibold">
                Review with AI
              </DialogTitle>
            </CardHeader>
          )}

          <AnimateChangeInHeight>
            <AnimatePresence mode="popLayout">
              {state === 'DISCLAIMER' && (
                <motion.div
                  key="disclaimer"
                  initial={{ opacity: 0, y: -20, filter: 'blur(8px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
                  transition={{ duration: 0.3 }}
                  className="py-2"
                >
                  <CardContent className="px-6 py-4">
                    <div className="mb-4 flex flex-col items-start gap-3">
                      <div className="flex items-center justify-center rounded-lg">
                        <ScanText className="text-brand-purple !size-10" />
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-semibold">
                          Only Works With Text
                        </span>
                        <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                          Beta
                        </span>
                      </div>
                    </div>

                    <p className="mb-4 text-slate-600">
                      Submissions that are design, video and other multimedia
                      heavy will require manual review.
                    </p>

                    <ul className="list-disc space-y-2 pl-6 text-slate-500 marker:text-slate-600">
                      <li>
                        <span>AI Review works best with written content</span>
                      </li>
                      <li>
                        <span>
                          Images in X threads, blogs, and other platforms still
                          remain inaccessible to AI models.
                        </span>
                      </li>
                      <li>
                        <span className="font-semibold">
                          Double check the work before announcing winners
                        </span>
                      </li>
                    </ul>
                  </CardContent>
                  <CardFooter className="flex flex-col px-6">
                    <Button
                      className="ph-no-capture mt-4 w-full"
                      size="lg"
                      onClick={() => {
                        setState('INIT');
                      }}
                    >
                      Agree & Proceed
                    </Button>
                  </CardFooter>
                </motion.div>
              )}
              {state === 'INIT' && (
                <motion.div
                  key="init"
                  initial={{ opacity: 0, y: -20, filter: 'blur(8px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
                  transition={{ duration: 0.3 }}
                >
                  <CardContent className="px-6 py-4">
                    <div className="space-y-2 font-medium">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-base text-slate-500">
                          Unreviewed Submissions
                          <Tooltip
                            content="We will only review unreviewed submissions. If you've already reviewed some submissions, those will remain untouched."
                            contentProps={{
                              style: {
                                zIndex: '100',
                              },
                            }}
                          >
                            <InfoIcon className="h-4 w-4 text-slate-400" />
                          </Tooltip>
                        </span>
                        <span className="text-xl font-semibold">
                          {totalSubmissions}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-base text-slate-500">
                          Credits Used
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-green-100 px-2 py-0 text-sm text-green-700">
                            Free
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-slate-500">
                        <span className="text-base">Estimated Time</span>
                        <span className="text-lg">{estimatedTime}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col px-6">
                    <Button
                      className="ph-no-capture mt-4 w-full"
                      size="lg"
                      onClick={() => {
                        onReviewClick?.();
                      }}
                    >
                      <Wand2 className="mr-2 h-5 w-5" />
                      Proceed
                    </Button>

                    <p className="text-muted-foreground mt-2 text-center text-sm">
                      AI can make mistakes. Check important info before choosing
                      winners.
                    </p>
                  </CardFooter>
                </motion.div>
              )}
              {state === 'PROCESSING' && (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0, y: -20, filter: 'blur(8px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
                  transition={{ duration: 0.3 }}
                >
                  <CardContent className="mt-4 flex flex-col items-center justify-center space-y-8 p-4">
                    <div className="w-12/12">
                      <ReviewLoadingAnimation />
                    </div>
                    <div className="relative mt-4 h-2 w-5/6 max-w-md overflow-hidden rounded-md bg-[#f1f5f9]">
                      <Progress
                        value={progress}
                        className="w-full bg-slate-100"
                        indicatorClassName="bg-indigo-500 duration-200"
                      />
                    </div>

                    <div className="text-center">
                      <p className="text-sm font-medium text-slate-500">
                        {`We're reviewing your submissions right now. Sit back and
                        relax, or contemplate your life choices for a moment.`}
                      </p>
                    </div>
                  </CardContent>
                  <CardFooter className="w-full bg-slate-50 py-3 text-center text-base text-slate-500">
                    <p className="w-full text-sm">
                      Approx. {estimatedTimeSingular} remaining
                    </p>
                  </CardFooter>
                </motion.div>
              )}
              {state === 'DONE' && (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, y: -20, filter: 'blur(8px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
                  transition={{ duration: 0.3 }}
                >
                  <CardContent className="flex flex-col items-center space-y-8 p-8 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
                      <Check className="h-8 w-8 stroke-[2.5] text-emerald-700" />
                    </div>

                    <div className="space-y-2">
                      <h2 className="text-xl font-semibold">
                        Successfully Reviewed
                      </h2>
                      <p className="mx-auto w-4/5 text-sm text-slate-500">
                        Remember, AI can make mistakes. Check before finalizing.
                      </p>
                    </div>

                    <div className="w-full space-y-2">
                      <StatItem
                        label="Total Reviewed"
                        value={completedStats.totalReviewed}
                        dotColor="bg-blue-400"
                      />
                      <StatItem
                        label="Shortlisted"
                        value={completedStats.shortlisted}
                        dotColor="bg-violet-400"
                      />
                      <StatItem
                        label="Low Quality"
                        value={completedStats.lowQuality}
                        dotColor="bg-stone-400"
                      />
                      <StatItem
                        label="Mid Quality"
                        value={completedStats.midQuality}
                        dotColor="bg-cyan-400"
                      />
                      <StatItem
                        label="Inaccessible"
                        value={completedStats.inaccessible}
                        dotColor="bg-red-300"
                      />
                      <StatItem
                        label="Needs Manual Review"
                        value={completedStats.needsReview}
                        dotColor="bg-amber-400"
                      />
                      <StatItem
                        label="Total time saved"
                        value={formatTime(completedStats.totalHoursSaved)}
                        dotColor="bg-green-400"
                      />
                    </div>

                    <Button
                      variant="outline"
                      className="w-full border-[#e2e8f0] text-[#62748e]"
                      onClick={onComplete}
                    >
                      Have a look
                    </Button>
                  </CardContent>
                </motion.div>
              )}
              {state === 'ERROR' && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: -20, filter: 'blur(8px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
                  transition={{ duration: 0.3 }}
                >
                  <CardContent className="flex flex-col items-center space-y-8 p-8 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
                      <XCircle className="h-8 w-8 stroke-[2.5] text-red-600" />
                    </div>

                    <div className="space-y-2">
                      <h2 className="text-xl font-semibold">Review Failed</h2>
                      <p className="mx-auto w-4/5 text-sm text-slate-500">
                        Something went wrong while reviewing the submissions.
                        Please try again.
                      </p>
                    </div>

                    <Button
                      variant="outline"
                      className="w-full border-[#e2e8f0] text-[#62748e]"
                      onClick={() => setState('INIT')}
                    >
                      Try Again
                    </Button>
                  </CardContent>
                </motion.div>
              )}
            </AnimatePresence>
          </AnimateChangeInHeight>
        </Card>
      </DialogContent>
    </Dialog>
  );
}

interface StatItemProps {
  label: string;
  post?: React.ReactNode;
  value: string | number;
  dotColor: string;
}
const StatItem = ({ label, post, value, dotColor }: StatItemProps) => (
  <div className="flex w-full items-center justify-between">
    <div className="flex items-center gap-2">
      <div className={`h-2 w-2 rounded-full ${dotColor}`} />
      <span className="text-slate-500">{label}</span>
      {post}
    </div>
    <span className="font-medium text-[#0f172b]">{value}</span>
  </div>
);

function formatTime(milliseconds: number): string {
  const totalMinutes = Math.floor(milliseconds / 60000);

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (!hours) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}
export function estimateTime(
  totalSubmissions: number,
  singular = false,
): string {
  console.log('total submissions', totalSubmissions);
  const lowerBoundSeconds = totalSubmissions * 10;
  const upperBoundSeconds = totalSubmissions * 20;

  if (singular) {
    const middleBoundSeconds = (lowerBoundSeconds + upperBoundSeconds) / 2;

    if (middleBoundSeconds < 60) {
      return `~${Math.round(middleBoundSeconds)}s`;
    }

    const middleBoundMinutes = Math.round(middleBoundSeconds / 60);
    return `~${middleBoundMinutes} min${middleBoundMinutes !== 1 ? 's' : ''}`;
  }

  if (upperBoundSeconds < 60) {
    return `~${lowerBoundSeconds}-${upperBoundSeconds}s`;
  }

  if (lowerBoundSeconds < 60) {
    return `~${lowerBoundSeconds}s-${Math.ceil(upperBoundSeconds / 60)} mins`;
  }

  const lowerBoundMinutes = Math.floor(lowerBoundSeconds / 60);
  const upperBoundMinutes = Math.ceil(upperBoundSeconds / 60);
  return `~${lowerBoundMinutes}-${upperBoundMinutes}mins`;
}
