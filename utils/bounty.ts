import type { BountyWithSubmissions } from '@/interface/bounty';
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

export const getBountyProgress = (bounty: BountyWithSubmissions) => {
  const bountyStatus = getBountyDraftStatus(
    bounty?.status,
    bounty?.isPublished
  );
  if (bountyStatus !== 'PUBLISHED') return '';
  const hasDeadlinePassed = isDeadlineOver(bounty?.deadline || '');
  if (!hasDeadlinePassed) return 'IN PROGRESS';
  if (bounty?.areWinnersPublished && bounty?.arePaymentsCompleted)
    return 'COMPLETED';
  if (bounty?.areWinnersPublished && !bounty?.arePaymentsCompleted)
    return 'WINNERS PUBLISHED - PAYMENTS PENDING';
  if (!bounty?.areWinnersPublished && bounty?.arePaymentsCompleted)
    return 'PAYMENTS COMPLETED';
  // add status - winners selected - WINNERS SELECTED
  return 'IN REVIEW';
};

export const getBgColor = (status: string) => {
  switch (status) {
    case 'PUBLISHED':
    case 'COMPLETED':
      return 'green';
    case 'DRAFT':
      return 'orange';
    case 'IN REVIEW':
      return 'brand.purple';
    default:
      return 'gray';
  }
};
