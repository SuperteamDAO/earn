import { useQuery } from '@tanstack/react-query';
import { Check, InfoIcon, Wand2, XCircle } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

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
    spam: 0,
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
    return unreviewedApplications?.filter(
      (appl) => !(appl.ai as GrantApplicationAi)?.review,
    );
  }, [unreviewedApplications]);

  const totalApplications = useMemo(() => {
    return unreviewedApplications?.length;
  }, [unreviewedApplications]);

  const estimatedTime = useMemo(() => {
    return estimateTime(unreviewedApplications?.length || 0);
  }, [unreviewedApplications?.length]);

  const onReviewClick = useCallback(async () => {
    setState('PROCESSING');

    const batchSize = 5;

    console.log('nonAnalysedApplications - ', nonAnalysedApplications);
    if (nonAnalysedApplications && nonAnalysedApplications.length > 0) {
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
              console.log('completed review for application - ', appl.id);
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
          spam: data.data.filter((s) => s.label === 'Spam').length,
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
        <p className="text-sm text-slate-500">
          We&apos;ve marked the submissions as{' '}
          <span
            className={cn(
              'ml-2 inline-flex w-fit whitespace-nowrap rounded-full px-2 text-center text-[10px] capitalize',
              colorMap['Spam'].bg,
              colorMap['Spam'].color,
            )}
          >
            Spam
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
          please review before announcing winners, as AI can make mistakes.
        </p>
      </div>,
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
                  <svg
                    width="16"
                    height="14"
                    viewBox="0 0 16 14"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <g clipPath="url(#clip0_2_520)">
                      <path
                        d="M6.51944 1.16758L5.47222 1.55313C5.38889 1.5832 5.33333 1.6625 5.33333 1.75C5.33333 1.8375 5.38889 1.9168 5.47222 1.94687L6.51944 2.33242L6.91111 3.36328C6.94167 3.44531 7.02222 3.5 7.11111 3.5C7.2 3.5 7.28056 3.44531 7.31111 3.36328L7.70278 2.33242L8.75 1.94687C8.83333 1.9168 8.88889 1.8375 8.88889 1.75C8.88889 1.6625 8.83333 1.5832 8.75 1.55313L7.70278 1.16758L7.31111 0.136719C7.28056 0.0546875 7.2 0 7.11111 0C7.02222 0 6.94167 0.0546875 6.91111 0.136719L6.51944 1.16758ZM1.28056 10.8117C0.761111 11.323 0.761111 12.1543 1.28056 12.6684L2.24167 13.6145C2.76111 14.1258 3.60556 14.1258 4.12778 13.6145L14.7194 3.18555C15.2389 2.67422 15.2389 1.84297 14.7194 1.32891L13.7583 0.385547C13.2389 -0.125781 12.3944 -0.125781 11.8722 0.385547L1.28056 10.8117ZM13.4611 2.25859L10.5444 5.12969L9.89722 4.49258L12.8139 1.62148L13.4611 2.25859ZM0.208333 3.20469C0.0833333 3.25117 0 3.36875 0 3.5C0 3.63125 0.0833333 3.74883 0.208333 3.79531L1.77778 4.375L2.36667 5.91992C2.41389 6.04297 2.53333 6.125 2.66667 6.125C2.8 6.125 2.91944 6.04297 2.96667 5.91992L3.55556 4.375L5.125 3.79531C5.25 3.74883 5.33333 3.63125 5.33333 3.5C5.33333 3.36875 5.25 3.25117 5.125 3.20469L3.55556 2.625L2.96667 1.08008C2.91944 0.957031 2.8 0.875 2.66667 0.875C2.53333 0.875 2.41389 0.957031 2.36667 1.08008L1.77778 2.625L0.208333 3.20469ZM9.98611 10.2047C9.86111 10.2512 9.77778 10.3687 9.77778 10.5C9.77778 10.6313 9.86111 10.7488 9.98611 10.7953L11.5556 11.375L12.1444 12.9199C12.1917 13.043 12.3111 13.125 12.4444 13.125C12.5778 13.125 12.6972 13.043 12.7444 12.9199L13.3333 11.375L14.9028 10.7953C15.0278 10.7488 15.1111 10.6313 15.1111 10.5C15.1111 10.3687 15.0278 10.2512 14.9028 10.2047L13.3333 9.625L12.7444 8.08008C12.6972 7.95703 12.5778 7.875 12.4444 7.875C12.3111 7.875 12.1917 7.95703 12.1444 8.08008L11.5556 9.625L9.98611 10.2047Z"
                        fill="#90A1B9"
                      />
                    </g>
                    <defs>
                      <clipPath id="clip0_2_520">
                        <rect width="16" height="14" fill="white" />
                      </clipPath>
                    </defs>
                  </svg>
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

                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M8.00334 14.6687C4.32134 14.6687 1.33667 11.684 1.33667 8.00199C1.33667 4.31999 4.32134 1.33533 8.00334 1.33533C11.6853 1.33533 14.67 4.31999 14.67 8.00199C14.67 11.684 11.6853 14.6687 8.00334 14.6687ZM8.00334 5.17333L5.17467 8.00199L8.00334 10.83L10.8313 8.00199L8.00334 5.17333Z"
                          fill="#CB76FF"
                        />
                      </svg>
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
                  AI can make mistakes. Check important info.
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
                    We&apos;re reviewing your submissions right now, sitback
                    relax, grab some coffee
                  </p>
                </div>
              </CardContent>
              <CardFooter className="w-full bg-slate-50 py-3 text-center text-base text-slate-500">
                <p className="w-full text-sm">
                  Approx {estimatedTime} remaining
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
                    Remember AI can make mistakes. Check before finalizing
                  </p>
                </div>

                <div className="w-full space-y-2">
                  <StatItem
                    label="Total Reviewed"
                    value={completedStats.totalReviewed}
                    dotColor="bg-yellow-400"
                  />
                  <StatItem
                    label="Spam"
                    value={completedStats.spam}
                    dotColor="bg-red-400"
                  />
                  <StatItem
                    label="Shortlisted"
                    value={completedStats.shortlisted}
                    dotColor="bg-green-400"
                  />
                  <StatItem
                    label="Unmarked"
                    value={completedStats.unmarked}
                    dotColor="bg-blue-200"
                    post={
                      <>
                        <span
                          className={cn(
                            'mx-2 inline-flex w-fit whitespace-nowrap rounded-full px-2 text-center text-[10px] capitalize',
                            colorMap['Reviewed'].bg,
                            colorMap['Reviewed'].color,
                          )}
                        >
                          Reviewed
                        </span>
                      </>
                    }
                  />
                  <StatItem
                    label="Total Hours Saved"
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
      <span className="text-[#62748e]">{label}</span>
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
function estimateTime(totalApplications: number): string {
  const lowerBoundSeconds = totalApplications * 20;
  const upperBoundSeconds = totalApplications * 30;

  if (upperBoundSeconds < 60) {
    return `~${lowerBoundSeconds}-${upperBoundSeconds}s`;
  }

  const lowerBoundMinutes = Math.floor(lowerBoundSeconds / 60);
  const upperBoundMinutes = Math.ceil(upperBoundSeconds / 60);

  return `~${lowerBoundMinutes}-${upperBoundMinutes}mins`;
}
