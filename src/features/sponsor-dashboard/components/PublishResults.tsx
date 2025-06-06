import { useQueryClient } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { usePostHog } from 'posthog-js/react';
import { useEffect, useState } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { api } from '@/lib/api';
import { dayjs } from '@/utils/dayjs';
import { cleanRewards } from '@/utils/rank';

import { BONUS_REWARD_POSITION } from '@/features/listing-builder/constants';

import type { Listing } from '../../listings/types';
import { selectedSubmissionAtom } from '../atoms';
import { useToggleWinner } from '../mutations/useToggleWinner';

interface Props {
  onClose: () => void;
  isOpen: boolean;
  totalWinners: number;
  totalPaymentsMade: number;
  bounty: Listing | undefined;
  remainings: { podiums: number; bonus: number } | null;
  submissionsLeft: number;
  submissions: Array<{ id: string; label?: string }>;
}

export function PublishResults({
  isOpen,
  onClose,
  totalWinners,
  totalPaymentsMade,
  bounty,
  remainings,
  submissionsLeft,
  submissions = [],
}: Props) {
  const [isPublishingResults, setIsPublishingResults] = useState(false);
  const [isWinnersAnnounced, setIsWinnersAnnounced] = useState(
    bounty?.isWinnersAnnounced,
  );
  const posthog = usePostHog();
  const router = useRouter();
  const queryClient = useQueryClient();
  const isDeadlinePassed = dayjs().isAfter(bounty?.deadline);
  const isProject = bounty?.type === 'project';
  if (isProject) totalWinners = 1;

  const rewards =
    bounty?.type === 'project'
      ? 1
      : cleanRewards(bounty?.rewards, true).length +
        (bounty?.rewards?.[BONUS_REWARD_POSITION]
          ? bounty?.maxBonusSpots || 0
          : 0);
  const notEnoughSubmissionsForBonus =
    remainings && remainings.bonus > 0 && submissionsLeft < remainings.bonus;
  const isWinnersAllSelected =
    isProject ||
    !remainings ||
    (remainings.podiums === 0 &&
      (remainings.bonus === 0 || notEnoughSubmissionsForBonus));

  let alertType:
    | 'loading'
    | 'info'
    | 'error'
    | 'warning'
    | 'success'
    | undefined = 'warning';
  let alertTitle = '';
  let alertDescription = '';
  if (!isWinnersAllSelected) {
    const remainingWinners = (rewards || 0) - totalWinners;
    alertType = 'error';
    alertTitle = 'Select All Winners!';
    alertDescription = `You still have to select ${remainingWinners} more ${
      remainingWinners === 1 ? 'winner' : 'winners'
    } before you can publish the results publicly.`;
  } else if (notEnoughSubmissionsForBonus) {
    alertType = 'warning';
    alertTitle = 'Not Enough Submissions for Bonus Spots';
    alertDescription = `You have ${remainings?.bonus} bonus spots remaining but do not have enough submissions left. You can still publish results, but not all bonus spots will be filled.`;
  } else if (rewards && totalPaymentsMade !== rewards) {
    const remainingPayments = (rewards || 0) - totalPaymentsMade;
    alertType = 'warning';
    alertTitle = 'Pay All Winners!';
    alertDescription = `Don't forget to pay your winners after publishing results. You have to pay to ${remainingPayments} ${
      remainingPayments === 1 ? 'winner' : 'winners'
    }.`;
  }

  const selectedSubmission = useAtomValue(selectedSubmissionAtom);
  const { mutateAsync: toggleWinner } = useToggleWinner(bounty);

  const publishResults = async () => {
    if (!bounty?.id) return;
    setIsPublishingResults(true);
    try {
      if (isProject) {
        if (selectedSubmission?.id) {
          await toggleWinner([
            {
              winnerPosition: 1,
              id: selectedSubmission?.id,
              isWinner: true,
            },
          ]);
        }
      }
      await api.post(`/api/listings/announce/${bounty?.id}/`);
      setIsWinnersAnnounced(true);
      setIsPublishingResults(false);
    } catch (e) {
      if (isProject) {
        if (selectedSubmission?.id) {
          await toggleWinner([
            {
              winnerPosition: null,
              id: selectedSubmission?.id,
              isWinner: false,
            },
          ]);
        }
      }
      setIsPublishingResults(false);
    }
  };

  useEffect(() => {
    if (!isWinnersAnnounced || bounty?.isWinnersAnnounced) return;
    const timer = setTimeout(() => {
      queryClient.invalidateQueries({
        queryKey: ['sponsor-submissions', bounty?.slug],
      });
      queryClient.invalidateQueries({
        queryKey: ['sponsor-dashboard-listing', bounty?.slug],
      });
      router.push(
        `/dashboard/listings/${bounty?.slug}/submissions?tab=payments`,
      );

      onClose();
    }, 1500);
    return () => clearTimeout(timer);
  }, [
    isWinnersAnnounced,
    bounty?.slug,
    bounty?.id,
    router,
    queryClient,
    onClose,
  ]);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={() => {
        if (isPublishingResults) return;
        if (isWinnersAnnounced) return;
        onClose();
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Publish Results</DialogTitle>
        </DialogHeader>
        <div className="-mx-6">
          <Separator />
        </div>
        <div className="space-y-4">
          {isWinnersAnnounced && (
            <div className="py-6 text-center">
              <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-green-600" />
              <h3 className="mb-2 text-lg font-semibold">
                Results Announced Successfully!
              </h3>
              <p className="text-muted-foreground text-sm">
                The results are now public and visible on the listing page.
              </p>
              {!bounty?.isWinnersAnnounced && (
                <p className="text-muted-foreground mt-2 text-xs">
                  Navigating to payments tab...
                </p>
              )}
            </div>
          )}

          {!isWinnersAnnounced &&
            rewards &&
            totalWinners === rewards &&
            alertType !== 'error' && (
              <div className="space-y-3">
                <p className="text-sm text-slate-800">
                  Publishing will make the results public for everyone to see.
                </p>
                <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700">
                  Note: You cannot undo this action once published.
                </p>
              </div>
            )}

          {!isWinnersAnnounced && alertTitle && alertDescription && (
            <Alert variant={alertType === 'error' ? 'destructive' : 'default'}>
              <AlertTriangle className="-mt-1 size-4" />
              <AlertTitle className="text-slate-800">{alertTitle}</AlertTitle>
              <AlertDescription className="mt-2 text-[13px] text-slate-700">
                {alertDescription}
              </AlertDescription>
            </Alert>
          )}

          {!isWinnersAnnounced &&
            rewards &&
            totalWinners === rewards &&
            !isDeadlinePassed && (
              <Alert variant="destructive">
                <AlertTriangle className="-mt-1 size-4" />
                <AlertTitle className="text-slate-800">
                  Listing Still Active
                </AlertTitle>
                <AlertDescription className="mt-2 text-[13px] text-slate-700">
                  Publishing before the deadline will close the listing
                  immediately.
                </AlertDescription>
              </Alert>
            )}

          {!isWinnersAnnounced &&
            submissions.some((submission) => submission.label === 'Spam') && (
              <Alert>
                <AlertTriangle className="-mt-1 size-4" />
                <AlertTitle className="text-slate-800">
                  {
                    submissions.filter(
                      (submission) => submission.label === 'Spam',
                    ).length
                  }{' '}
                  Spam Submission(s)
                </AlertTitle>
                <AlertDescription className="mt-2 text-[13px] text-slate-700">
                  Marked submissions will result in credit penalties for
                  applicants.
                </AlertDescription>
              </Alert>
            )}
        </div>

        <DialogFooter>
          {!isWinnersAnnounced && (
            <div className="flex gap-3">
              <Button
                disabled={
                  !isWinnersAllSelected ||
                  alertType === 'error' ||
                  isPublishingResults
                }
                onClick={() => {
                  posthog.capture('announce winners_sponsor');
                  publishResults();
                }}
              >
                {isPublishingResults ? 'Publishing...' : 'Publish'}
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
