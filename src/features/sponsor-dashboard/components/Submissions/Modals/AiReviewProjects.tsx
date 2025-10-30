import { useQuery } from '@tanstack/react-query';
import { Check, InfoIcon, Wand2, XCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import posthog from 'posthog-js';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

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
import { cn } from '@/utils/cn';

import {
  type Listing,
  type ProjectApplicationAi,
} from '@/features/listings/types';
import { useCommitReviewsSubmissions } from '@/features/sponsor-dashboard/mutations/useCommitReviewsSubmissions';
import { unreviewedSubmissionsQuery } from '@/features/sponsor-dashboard/queries/unreviewed-submissions';
import { colorMap } from '@/features/sponsor-dashboard/utils/statusColorMap';

interface Props {
  applications: SubmissionWithUser[] | undefined;
  listing: Listing | undefined;
}
export default function AiReviewProjectApplicationsModal({
  applications,
  listing,
}: Props) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<'INIT' | 'PROCESSING' | 'DONE' | 'ERROR'>(
    'INIT',
  );
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
    const totalDuration = 10000;
    const updateInterval = 200;
    const steps = totalDuration / updateInterval;
    const progressPerStep = 100 / steps;

    progressIntervalRef.current = setInterval(() => {
      currentProgress += progressPerStep;
      const cappedProgress = Math.min(currentProgress, 99);
      setProgress(cappedProgress);

      if (cappedProgress >= 99) {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
      }
    }, updateInterval);

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
    totalHoursSaved: 0,
  });

  const {
    data: unreviewedApplications,
    refetch: refetchUnreviewedApplications,
  } = useQuery({
    ...unreviewedSubmissionsQuery(
      { id: listing?.id },
      listing?.slug,
      !!listing &&
        !!user?.currentSponsorId &&
        user?.currentSponsorId === listing?.sponsorId,
    ),
    enabled:
      !!listing &&
      listing.type === 'project' &&
      !!user?.currentSponsorId &&
      user?.currentSponsorId === listing?.sponsorId,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (
      !!listing &&
      listing.type === 'project' &&
      !!user?.currentSponsorId &&
      user?.currentSponsorId === listing?.sponsorId
    ) {
      refetchUnreviewedApplications();
    }
  }, [
    applications,
    refetchUnreviewedApplications,
    listing,
    user?.currentSponsorId,
  ]);

  const { mutateAsync: commitReviews } = useCommitReviewsSubmissions(
    listing?.slug || '',
    listing?.id || '',
  );

  const nonAnalysedApplications = useMemo(() => {
    console.log('unreviewedApplications', unreviewedApplications);
    return unreviewedApplications?.filter(
      (appl) => !(appl.ai as ProjectApplicationAi)?.review,
    );
  }, [unreviewedApplications]);

  const totalApplications = useMemo(() => {
    return unreviewedApplications?.length;
  }, [unreviewedApplications]);

  const estimatedTime = useMemo(() => {
    return estimateTime(nonAnalysedApplications?.length || 1);
  }, [nonAnalysedApplications?.length]);

  const [estimatedTimeSingular] = useState('~30 seconds');
  useMemo(() => {
    return estimateTime(nonAnalysedApplications?.length || 1, true);
  }, [nonAnalysedApplications?.length]);

  const onReviewClick = useCallback(async () => {
    posthog.capture('start_ai review projects');
    setState('PROCESSING');

    setTimeout(async () => {
      setProgress(100);
      try {
        console.log('Commiting Reviewed applications');
        const data = await commitReviews();
        console.log('commit data - ', data.data);
        setCompletedStats({
          totalReviewed: data.data.length,
          shortlisted: data.data.filter((s) => s.label === 'Shortlisted')
            .length,
          midQuality: data.data.filter((s) => s.label === 'Mid_Quality').length,
          lowQuality: data.data.filter((s) => s.label === 'Low_Quality').length,
          totalHoursSaved: data.data.length * 6_00_000,
        });
        posthog.capture('complete_ai review project');
        setState('DONE');
        await refetchUnreviewedApplications();
      } catch (error: any) {
        console.log(
          'error occured while commiting reviewed applications',
          error,
        );
        setState('ERROR');
      }
    }, 10000);
  }, [applications, unreviewedApplications, nonAnalysedApplications, posthog]);
  function onComplete() {
    setState('INIT');
    setProgress(0);
    toast(
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Check className="h-5 w-5 text-[#AEAEAE]" strokeWidth={3} />
          <span className="text-base font-medium">AI Review Completed</span>
        </div>
        <div className="text-sm text-slate-500">
          <p>{`We've added review notes and labelled the submissions as `}</p>
          <span className="mt-1">
            <span
              className={cn(
                'mr-2 inline-flex w-fit rounded-full px-2 text-center text-[10px] whitespace-nowrap capitalize',
                colorMap['Shortlisted'].bg,
                colorMap['Shortlisted'].color,
              )}
            >
              Shortlisted
            </span>
            <span
              className={cn(
                'mr-2 inline-flex w-fit rounded-full px-2 text-center text-[10px] whitespace-nowrap capitalize',
                colorMap['Mid_Quality'].bg,
                colorMap['Mid_Quality'].color,
              )}
            >
              Mid Quality
            </span>
            <span
              className={cn(
                'mr-2 inline-flex w-fit rounded-full px-2 text-center text-[10px] whitespace-nowrap capitalize',
                colorMap['Low_Quality'].bg,
                colorMap['Low_Quality'].color,
              )}
            >
              Low Quality
            </span>
          </span>
          <p className="mt-1">
            Please review before announcing winners, as AI can make mistakes.
          </p>
        </div>
      </div>,
      {
        duration: 5000,
        closeButton: true,
        className: 'w-[24rem] right-0',
      },
    );
    setOpen(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(s) => {
        if (state === 'PROCESSING') return;
        if (s === false) posthog.capture('close_ai review projects');
        setOpen(s);
      }}
    >
      {!!listing?.isActive &&
        !listing?.isArchived &&
        listing?.type === 'project' &&
        !listing?.isWinnersAnnounced &&
        listing?.isPublished &&
        !!listing?.ai?.context &&
        !!unreviewedApplications?.length && (
          <DialogTrigger asChild>
            <button
              className="h-9"
              onClick={() => {
                posthog.capture('open_ai review projects');
              }}
            >
              <p className="mb-1 text-xs text-slate-400">
                {unreviewedApplications?.length} Applications to review
              </p>
              <div className="group bg-background relative inline-flex h-full overflow-hidden rounded-lg p-[0.125rem] focus:outline-hidden">
                <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#FF79C1_0%,#76C5FF_50%,#FF79C1_100%)]" />
                <span className="ph-no-capture bg-background inline-flex h-full w-full cursor-pointer items-center justify-center gap-2 rounded-md px-4 py-1 text-xs font-medium text-slate-800 backdrop-blur-3xl group-hover:bg-slate-50">
                  <WandAnimated
                    className="!size-4"
                    stickColor="bg-slate-600"
                    starColor="bg-slate-400"
                  />
                  Review with AI
                </span>
              </div>
            </button>
          </DialogTrigger>
        )}
      <DialogContent className="p-0 sm:max-w-md" hideCloseIcon>
        <Card className="border-0 shadow-none">
          <CardHeader className="flex flex-row items-center justify-between border-b p-0 px-6 py-3">
            <DialogTitle className="text-xl font-semibold">
              Review with AI
            </DialogTitle>
          </CardHeader>

          <AnimateChangeInHeight>
            <AnimatePresence mode="popLayout">
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
                          Unreviewed Applications
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
                          {totalApplications}
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
                      AI can make mistakes. Check important info before
                      approving or rejecting a project application.
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
                  <CardContent className="mt-8 flex flex-col items-center justify-center space-y-8 p-8">
                    <div className="relative h-2 w-2/4 max-w-md overflow-hidden rounded-md bg-[#f1f5f9]">
                      <Progress
                        value={progress}
                        className="w-full bg-slate-100"
                        indicatorClassName="bg-linear-to-r from-[#FF79C1] to-[#76C5FF] duration-200"
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
                        Something went wrong while reviewing the applications.
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
  totalApplications: number,
  singular = false,
): string {
  console.log('total applications', totalApplications);
  const lowerBoundSeconds = totalApplications * 10;
  const upperBoundSeconds = totalApplications * 20;

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
