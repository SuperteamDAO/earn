import type { Bounty, BountyWithSubmissions } from '@/interface/bounty';
import { dayjs } from '@/utils/dayjs';

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

export const getColorStyles = (status: string) => {
  switch (status) {
    case 'Published':
    case 'Completed':
      return { bgColor: '#D1FAE5', color: '#0D9488' };
    case 'Payment Pending':
      return { bgColor: '#ffecb3', color: '#F59E0B' };
    case 'Draft':
      return { bgColor: 'brand.slate.100', color: 'brand.slate.400' };
    case 'In Review':
      return { bgColor: 'cyan.100', color: 'cyan.600' };
    case 'In Progress':
      return { bgColor: '#F3E8FF', color: '#8B5CF6' };
    default:
      return { bgColor: 'gray', color: 'white' };
  }
};
