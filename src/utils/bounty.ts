import type { Bounty, BountyWithSubmissions } from '@/interface/bounty';
import { dayjs } from '@/utils/dayjs';

export const getDeadlineFromNow = (deadline: string | undefined) =>
  deadline ? dayjs(deadline).fromNow() : '-';

export const formatDeadline = (deadline: string | undefined) =>
  deadline ? dayjs(deadline).format('MMM D, YYYY HH:mm') : '-';

export const isDeadlineOver = (deadline: string | undefined) =>
  deadline ? dayjs().isAfter(dayjs(deadline)) : false;

export const getBountyDraftStatus = (
  status: string | undefined,
  isPublished: boolean | undefined
) => {
  if (status !== 'OPEN') return 'CLOSED';
  if (isPublished) return 'PUBLISHED';
  return 'DRAFT';
};

export const getBountyProgress = (
  bounty: Bounty | BountyWithSubmissions | null
) => {
  if (!bounty) return '-';
  const rewardsLength = Object.keys(bounty?.rewards || {})?.length || 0;
  const bountyStatus = getBountyDraftStatus(
    bounty?.status,
    bounty?.isPublished
  );
  if (bountyStatus !== 'PUBLISHED') return '';
  const hasDeadlinePassed = isDeadlineOver(bounty?.deadline || '');
  if (!hasDeadlinePassed) return 'IN PROGRESS';
  if (bounty?.isWinnersAnnounced && bounty?.totalPaymentsMade === rewardsLength)
    return 'COMPLETED';
  if (bounty?.isWinnersAnnounced && bounty?.totalPaymentsMade !== rewardsLength)
    return 'ANNOUNCED - PAYMENTS PENDING';
  if (
    !bounty?.isWinnersAnnounced &&
    bounty?.totalWinnersSelected === rewardsLength &&
    bounty?.totalPaymentsMade === rewardsLength
  )
    return 'PAYMENTS COMPLETED';
  if (
    !bounty?.isWinnersAnnounced &&
    bounty?.totalWinnersSelected === rewardsLength
  )
    return 'WINNERS SELECTED';
  return 'IN REVIEW';
};

export const getBgColor = (status: string) => {
  switch (status) {
    case 'PUBLISHED':
    case 'COMPLETED':
      return 'green';
    case 'ANNOUNCED - PAYMENTS PENDING':
      return 'green.400';
    case 'PAYMENTS COMPLETED':
      return 'green.500';
    case 'WINNERS SELECTED':
      return 'green.300';
    case 'DRAFT':
      return 'orange';
    case 'IN REVIEW':
      return 'brand.purple';
    default:
      return 'gray';
  }
};
