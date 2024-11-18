import { type status } from '@prisma/client';
import { atom, useAtom } from 'jotai';
import { Pencil } from 'lucide-react';
import { useRouter } from 'next/router';

import { useUser } from '@/store/user';
import { cn } from '@/utils';
import { dayjs } from '@/utils/dayjs';

type BountySnackbarType = {
  isCaution: boolean | undefined;
  submissionCount: number;
  deadline: string | undefined;
  rewardAmount: number | undefined;
  type: string | undefined;
  isPublished: boolean | undefined;
  status?: status;
  sponsorId: string | undefined;
  slug: string | undefined;
};

export const bountySnackbarAtom = atom<BountySnackbarType | null>(null);

export const BountySnackbar = () => {
  const router = useRouter();
  const [bountySnackbar] = useAtom(bountySnackbarAtom);
  const user = useUser();

  const { asPath, query } = router;

  const showSnackbar = asPath.split('/')[1] === 'listings';

  if (!bountySnackbar) return null;

  const {
    submissionCount,
    deadline,
    rewardAmount,
    type,
    isPublished,
    isCaution,
    sponsorId,
    slug,
  } = bountySnackbar;

  const isPreview = !!query['preview'];
  // nsb == no snackbar, but only for previews or drafts, solves edge case of isCaution listing snackbar
  if (!!query['nsb'] && !isPublished) return null;

  const isExpired = deadline && dayjs(deadline).isBefore(dayjs());

  const isPreviewSponsor =
    !isPublished && isPreview && user.user?.currentSponsorId === sponsorId;

  const getBackgroundColor = () => {
    if (!isPublished && isPreview) return 'bg-slate-500';
    if (!isPublished) return 'bg-[#DC4830]';
    if (isExpired) return 'bg-[#6A6A6A]';
    if (isCaution) return 'bg-[#DC4830]';
    return 'bg-[#B869D3]';
  };

  const getSnackbarMessage = (): string | null => {
    const daysToDeadline = deadline
      ? dayjs(deadline).diff(dayjs(), 'day')
      : null;
    if (!isPublished && isPreview) {
      if (user.user?.currentSponsorId === sponsorId) {
        return 'Note: This link is for preview purposes only and is accessible only to those who have it. It is not your final link for sharing with your community';
      } else
        return 'This Listing Is In Preview Mode. Check Out Other Listings on Our Homepage!';
    }
    if (!isPublished)
      return 'This Listing Is Inactive Right Now. Check Out Other Listings on Our Homepage!';
    if (isExpired)
      return 'The Deadline for This Listing Has Passed. Check Out Other Listings on the Homepage!';
    if (isCaution)
      return 'Proceed with caution! Some users have flagged this listing as potentially misleading.';
    if (daysToDeadline && daysToDeadline < 3)
      return `🕛 Expiring Soon: ${
        type === 'bounty' ? 'Submit' : 'Apply'
      } while you still have the chance!`;
    if (
      rewardAmount &&
      ((type === 'bounty' && rewardAmount > 1000) ||
        (type === 'project' && rewardAmount > 1500))
    )
      return `🤑 Mo' Money, Fewer Problems: Higher than average total ${type} reward`;
    if (
      (type === 'bounty' && submissionCount <= 1) ||
      (type === 'project' && submissionCount < 10)
    ) {
      if (submissionCount === 0) {
        return type === 'bounty'
          ? '🔥 High chance of winning: No submissions have been made for this bounty yet!'
          : '🔥 The Odds Are in Your Favour! No applications yet';
      }
      return type === 'bounty'
        ? `🔥 High chance of winning: Only ${submissionCount} submission(s) have been made for this bounty yet!`
        : '🔥 The Odds Are in Your Favour! Not too many applications yet';
    }

    return null;
  };

  const message = getSnackbarMessage();
  const bgColorClass = getBackgroundColor();

  if (showSnackbar && bountySnackbar && message) {
    return (
      <div
        className={cn(
          'flex w-full items-center justify-center gap-1 text-white',
          bgColorClass,
          isPreviewSponsor ? 'cursor-pointer' : 'cursor-default',
        )}
        onClick={() => {
          if (!isPreviewSponsor) return;
          router.push(`/dashboard/listings/${slug}/edit`);
        }}
      >
        {isPreviewSponsor && <Pencil className="h-4 w-4" />}
        <p className="p-3 text-center text-xs font-medium md:text-sm">
          {message}
        </p>
      </div>
    );
  }
  return null;
};
