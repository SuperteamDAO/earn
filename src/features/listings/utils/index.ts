import { Superteams } from '@/constants/Superteam';
import type { Bounty, BountyWithSubmissions } from '@/features/listings';
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

export const isDeadlineOver = (deadline: string | undefined) =>
  deadline ? dayjs().isAfter(dayjs(deadline)) : false;

export const getRegionTooltipLabel = (region: string | undefined) => {
  const country = Superteams.find((st) => st.region === region)?.displayValue;

  switch (region) {
    case 'GLOBAL':
      return 'This listing is open to everyone in the world!';
    case 'BALKAN':
      return 'You need to be a resident of one of the Balkan countries to be able to participate in this listing';
    default:
      return `You need to be a resident of ${country} to participate in this listing`;
  }
};

export const getListingDraftStatus = (
  status: string | undefined,
  isPublished: boolean | undefined,
) => {
  if (status !== 'OPEN') return 'CLOSED';
  if (isPublished) return 'PUBLISHED';
  return 'DRAFT';
};

export const getListingTypeLabel = (type: string) => {
  if (type === 'project') return 'Project';
  if (type === 'hackathon') return 'Hackathon';
  return 'Bounty';
};

export const getBountyStatus = (
  bounty: Bounty | BountyWithSubmissions | null,
) => {
  if (!bounty) return 'DRAFT';
  const rewardsLength = Object.keys(bounty?.rewards || {})?.length || 0;
  const bountyStatus = getListingDraftStatus(
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

export function tweetTemplate(url: string) {
  return `The results of this latest @SuperteamEarn listing are out. Congratulations to the winners👏

${url}
`;
}

export function tweetEmbedLink(content: string) {
  const tweetUrl = new URL(`https://twitter.com/intent/tweet`);
  tweetUrl.searchParams.set('text', content);
  const stringUrl = tweetUrl.toString();
  return stringUrl;
}
