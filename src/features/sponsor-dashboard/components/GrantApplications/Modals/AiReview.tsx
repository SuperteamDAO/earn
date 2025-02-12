import { useQuery } from '@tanstack/react-query';
import { Check, InfoIcon, Wand2, XCircle } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
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
import { chunkArray } from '@/utils/chunkArray';
import { cn } from '@/utils/cn';

import {
  type GrantApplicationAi,
  type GrantsAi,
  type GrantWithApplicationCount,
} from '@/features/grants/types';
import { useCommitReviews } from '@/features/sponsor-dashboard/mutations/useCommitReviews';
import { useReviewApplication } from '@/features/sponsor-dashboard/mutations/useReviewApplication';
import { unreviewedGrantApplicationsQuery } from '@/features/sponsor-dashboard/queries/unreviewed-grant-applications';
import { type GrantApplicationWithUser } from '@/features/sponsor-dashboard/types';
import { colorMap } from '@/features/sponsor-dashboard/utils/statusColorMap';

interface Props {
  applications: GrantApplicationWithUser[] | undefined;
  grant: GrantWithApplicationCount | undefined;
}
export default function AiReviewModal({ applications, grant }: Props) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<'INIT' | 'PROCESSING' | 'DONE' | 'ERROR'>(
    'INIT',
  );
  const [progress, setProgress] = useState(0);
  const [completedStats, setCompletedStats] = useState({
    totalReviewed: 0,
    lowQuality: 0,
    shortlisted: 0,
    unmarked: 0,
    totalHoursSaved: 0,
  });

  const { data: unreviewedApplications } = useQuery({
    ...unreviewedGrantApplicationsQuery({ id: grant?.id }, grant?.slug),
  });

  const { mutateAsync: reviewApplication } = useReviewApplication(
    grant?.slug || '',
  );
  const { mutateAsync: commitReviews } = useCommitReviews(
    grant?.slug || '',
    grant?.id || '',
  );

  const nonAnalysedApplications = useMemo(() => {
    console.log('unreviewedApplications', unreviewedApplications);
    return unreviewedApplications?.filter(
      (appl) => !(appl.ai as GrantApplicationAi)?.review,
    );
  }, [unreviewedApplications]);

  const totalApplications = useMemo(() => {
    return unreviewedApplications?.length;
  }, [unreviewedApplications]);

  const estimatedTime = useMemo(() => {
    return estimateTime(nonAnalysedApplications?.length || 1);
  }, [nonAnalysedApplications?.length]);

  const [estimatedTimeSingular, setEstimatedTimeSingular] = useState('~0mins');
  useMemo(() => {
    return estimateTime(nonAnalysedApplications?.length || 1, true);
  }, [nonAnalysedApplications?.length]);

  const onReviewClick = useCallback(async () => {
    setState('PROCESSING');

    const batchSize = 5;
    const initalSize = nonAnalysedApplications?.length || 0;

    console.log('nonAnalysedApplications - ', nonAnalysedApplications);
    if (nonAnalysedApplications && nonAnalysedApplications.length > 0) {
      setEstimatedTimeSingular(estimateTime(initalSize || 1, true));
      const totalApplications = nonAnalysedApplications.length;
      let processedApplications = 0;
      const batchedApplications = chunkArray(
        nonAnalysedApplications,
        batchSize,
      );

      for (const application of batchedApplications) {
        await Promise.all(
          application.map(async (appl) => {
            try {
              console.log('start review for application - ', appl.id);
              await reviewApplication(appl);
              processedApplications++;
              setProgress(() =>
                Math.round((processedApplications / totalApplications) * 100),
              );
              setEstimatedTimeSingular(
                estimateTime((initalSize || 1) - processedApplications, true),
              );
            } catch (error: any) {
              console.log(
                'Error occured while reviewing application with id ',
                appl.id,
              );
            }
          }),
        );
      }
    }
    setTimeout(async () => {
      setProgress(100);
      try {
        console.log('Commiting Reviewed applications');
        const data = await commitReviews();
        console.log('commit data - ', data.data);
        setCompletedStats({
          totalReviewed: data.data.length,
          lowQuality: data.data.filter((s) => s.label === 'Low_Quality').length,
          shortlisted: data.data.filter((s) => s.label === 'Shortlisted')
            .length,
          unmarked: data.data.filter(
            (s) => s.label === 'Reviewed' || s.label === 'Unreviewed',
          ).length,
          totalHoursSaved: data.data.length * 6_00_000,
        });
        setState('DONE');
      } catch (error: any) {
        console.log(
          'error occured while commiting reviewed applications',
          error,
        );
        setState('ERROR');
      }
    }, 500);
  }, [applications, unreviewedApplications, nonAnalysedApplications]);
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
          <p>
            {`We've added review notes and labelled the submissions as `}
            <span
              className={cn(
                'ml-2 inline-flex w-fit whitespace-nowrap rounded-full px-2 text-center text-[10px] capitalize',
                colorMap['Low_Quality'].bg,
                colorMap['Low_Quality'].color,
              )}
            >
              Low Quality
            </span>
            <span
              className={cn(
                'ml-2 inline-flex w-fit whitespace-nowrap rounded-full px-2 text-center text-[10px] capitalize',
                colorMap['Shortlisted'].bg,
                colorMap['Shortlisted'].color,
              )}
            >
              Shortlisted
            </span>
            <span
              className={cn(
                'mx-2 inline-flex w-fit whitespace-nowrap rounded-full px-2 text-center text-[10px] capitalize',
                colorMap['Reviewed'].bg,
                colorMap['Reviewed'].color,
              )}
            >
              Reviewed
            </span>
          </p>
          <p>
            Please review before announcing winners, as AI can make mistakes.
          </p>
        </div>
      </div>,
      {
        duration: Infinity,
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
        setOpen(s);
      }}
    >
      {!!grant?.isActive &&
        !grant?.isArchived &&
        !!(grant?.ai as GrantsAi).context &&
        !!unreviewedApplications?.length && (
          <DialogTrigger asChild>
            <button>
              <p className="mb-1 text-xs text-slate-400">
                {unreviewedApplications?.length} Applications to review
              </p>
              <div className="group relative inline-flex h-10 overflow-hidden rounded-[calc(1.5px+0.375rem-2px)] bg-background p-[1.5px] pb-[1.8px] shadow-[0px_2px_2.3px_0px_#0000002B] focus:outline-none">
                <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#FF79C1_0%,#76C5FF_50%,#FF79C1_100%)]" />
                <span className="inline-flex h-full w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-background px-4 py-1 text-sm font-medium text-slate-500 backdrop-blur-3xl group-hover:bg-slate-50">
                  <img src="/assets/ai-wand.svg" alt="Auto Review AI" />
                  Auto Review
                </span>
              </div>
            </button>
          </DialogTrigger>
        )}
      <DialogContent className="p-0 sm:max-w-md" hideCloseIcon>
        <Card className="border-0 shadow-none">
          <CardHeader className="flex flex-row items-center justify-between border-b p-0 px-6 py-3">
            <DialogTitle className="text-xl font-semibold">
              Auto Review
            </DialogTitle>
            {/* <div className="flex items-center text-muted-foreground"> */}
            {/*   <span className="text-sm">Powered by</span> */}
            {/*   <svg */}
            {/*     className="ml-2 h-5 w-5" */}
            {/*     viewBox="0 0 24 24" */}
            {/*     fill="none" */}
            {/*     xmlns="http://www.w3.org/2000/svg" */}
            {/*   > */}
            {/*     <path */}
            {/*       d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" */}
            {/*       stroke="currentColor" */}
            {/*       strokeWidth="2" */}
            {/*       strokeLinecap="round" */}
            {/*       strokeLinejoin="round" */}
            {/*     /> */}
            {/*   </svg> */}
            {/*   <span className="ml-1 text-sm">ChatGPT</span> */}
            {/* </div> */}
          </CardHeader>

          {state === 'INIT' && (
            <>
              <CardContent className="px-6 py-4">
                <div className="space-y-2 font-medium">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-base text-slate-500">
                      Unreviewed Applications
                      <Tooltip
                        content="We will only review unreviewed submissions. If you’ve already reviewed some submissions, those will remain untouched."
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
                  className="mt-4 w-full"
                  size="lg"
                  onClick={() => {
                    onReviewClick?.();
                  }}
                >
                  <Wand2 className="mr-2 h-5 w-5" />
                  Auto Review
                </Button>

                <p className="mt-2 text-center text-sm text-muted-foreground">
                  AI can make mistakes, and cannot access external links in
                  applications. Check important info.
                </p>
              </CardFooter>
            </>
          )}
          {state === 'PROCESSING' && (
            <>
              <CardContent className="mt-8 flex flex-col items-center justify-center space-y-8 p-8">
                <div className="relative h-2 w-2/4 max-w-md overflow-hidden rounded-md bg-[#f1f5f9]">
                  <Progress
                    value={progress}
                    className="w-full bg-slate-100"
                    indicatorClassName="bg-gradient-to-r from-[#FF79C1] to-[#76C5FF]"
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
            </>
          )}
          {state === 'DONE' && (
            <>
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
                    dotColor="bg-yellow-400"
                  />
                  <StatItem
                    label="Shortlisted"
                    value={completedStats.shortlisted}
                    dotColor="bg-green-400"
                  />
                  <StatItem
                    label="Low Quality"
                    value={completedStats.lowQuality}
                    dotColor="bg-red-400"
                  />
                  <StatItem
                    label="Reviewed"
                    value={completedStats.unmarked}
                    dotColor="bg-blue-200"
                    post={
                      <>
                        <Badge
                          variant="secondary"
                          className={cn(
                            'inline-flex w-fit whitespace-nowrap px-1 py-0 text-center text-xs text-slate-500',
                          )}
                        >
                          neither low quality nor shortlisted
                        </Badge>
                      </>
                    }
                  />
                  <StatItem
                    label="Total time saved"
                    value={formatTime(completedStats.totalHoursSaved)}
                    dotColor="bg-gray-300"
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
            </>
          )}
          {state === 'ERROR' && (
            <>
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
            </>
          )}
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
