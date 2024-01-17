import type { Bounty, BountyWithSubmissions } from '@/interface/bounty';
import { dayjs } from '@/utils/dayjs';

export const getDeadlineFromNow = (deadline: string | undefined) =>
  deadline ? dayjs(deadline).fromNow() : '-';

export const formatDeadline = (
  deadline: string | undefined,
  applicationType: 'fixed' | 'rolling' | undefined,
) => {
  if (applicationType === 'rolling') {
    return 'Rolling';
  }
  if (applicationType === 'fixed') {
    return deadline ? dayjs(deadline).format('DD MMM h:mm A') : '-';
  }
  return '-';
};

const isDeadlineOver = (deadline: string | undefined) =>
  deadline ? dayjs().isAfter(dayjs(deadline)) : false;

export const getBountyDraftStatus = (
  status: string | undefined,
  isPublished: boolean | undefined,
) => {
  if (status !== 'OPEN') return 'CLOSED';
  if (isPublished) return 'PUBLISHED';
  return 'DRAFT';
};

export const getBountyTypeLabel = (type: string) => {
  if (type === 'permissioned') return 'Project';
  return 'Bounty';
};

export const getBountyStatus = (
  bounty: Bounty | BountyWithSubmissions | null,
) => {
  if (!bounty) return 'DRAFT';
  const rewardsLength = Object.keys(bounty?.rewards || {})?.length || 0;
  const bountyStatus = getBountyDraftStatus(
    bounty?.status,
    bounty?.isPublished,
  );
  const hasDeadlinePassed = isDeadlineOver(bounty?.deadline || '');

  switch (bountyStatus) {
    case 'DRAFT':
      return 'Draft';
    case 'CLOSED':
      return 'Closed';
    case 'PUBLISHED':
      if (!hasDeadlinePassed && !bounty?.isWinnersAnnounced)
        return 'In Progress';
      if (!bounty?.isWinnersAnnounced) return 'In Review';
      if (
        bounty?.isWinnersAnnounced &&
        bounty?.totalPaymentsMade !== rewardsLength
      )
        return 'Payment Pending';
      if (
        bounty?.isWinnersAnnounced &&
        bounty?.totalPaymentsMade === rewardsLength
      )
        return 'Completed';
      return 'In Review';
    default:
      return 'Draft';
  }
};

export const getBgColor = (status: string) => {
  switch (status) {
    case 'Published':
    case 'Completed':
      return 'green';
    case 'Payment Pending':
      return 'green.400';
    case 'Draft':
      return 'orange';
    case 'In Review':
      return 'brand.purple';
    default:
      return 'gray';
  }
};
