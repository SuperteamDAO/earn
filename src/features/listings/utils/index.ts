import { Superteams } from '@/constants/Superteam';
import type { Listing, ListingWithSubmissions } from '@/features/listings';
import { dayjs } from '@/utils/dayjs';

export const formatDeadline = (
  deadline: string | undefined,
  applicationType: 'fixed' | 'rolling' | undefined,
  type: string | undefined,
) => {
  if (type === 'grant') {
    return 'Ongoing';
  }
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
  if (type === 'bounty') return 'Bounty';
  if (type === 'grant') return 'Grant';
  return;
};

export const getListingStatus = (
  listing: Listing | ListingWithSubmissions | any,
  isGrant?: boolean,
) => {
  if (!listing) return 'DRAFT';

  const rewardsLength = Object.keys(listing?.rewards || {}).length;
  const listingStatus = getListingDraftStatus(
    listing?.status,
    listing?.isPublished,
  );
  const hasDeadlinePassed = isDeadlineOver(listing?.deadline || '');

  if (listingStatus === 'DRAFT') return 'Draft';
  if (listing?.type === 'grant' || isGrant) return 'Ongoing';

  switch (listingStatus) {
    case 'CLOSED':
      return 'Closed';
    case 'PUBLISHED':
      if (!hasDeadlinePassed && !listing?.isWinnersAnnounced)
        return 'In Progress';
      if (!listing?.isWinnersAnnounced) return 'In Review';
      if (
        listing?.isWinnersAnnounced &&
        listing?.totalPaymentsMade !== rewardsLength
      )
        return 'Payment Pending';
      if (
        listing?.isWinnersAnnounced &&
        listing?.totalPaymentsMade === rewardsLength
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
    case 'Ongoing':
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

export function userRegionEligibilty(
  region: string | undefined,
  userLocation: string | undefined,
) {
  if (region === 'GLOBAL') {
    return true;
  }

  const superteam = Superteams.find((st) => st.region === region);

  const isEligible =
    !!(userLocation && superteam?.country.includes(userLocation)) || false;

  return isEligible;
}
