import { CombinedRegions } from '@/constants/Superteam';
import type {
  Listing,
  ListingWithSubmissions,
  StatusFilter,
} from '@/features/listings';
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

export const getRegionTooltipLabel = (
  region: string | undefined,
  isGrant: boolean = false,
) => {
  const country = CombinedRegions.find(
    (st) => st.region === region,
  )?.displayValue;

  switch (region) {
    case 'GLOBAL':
      return 'This listing is open to everyone in the world!';
    case 'BALKAN':
      return `You need to be a resident of one of the Balkan countries to be able to participate in this ${isGrant ? 'grant' : 'listing'}`;
    default:
      return `You need to be a resident of ${country} to participate in this ${isGrant ? 'grant' : 'listing'} `;
  }
};

export const getListingDraftStatus = (
  status: string | undefined,
  isPublished: boolean | undefined,
  isVerifying: boolean | undefined,
) => {
  if (status !== 'OPEN') return 'CLOSED';
  if (isVerifying) return 'VERIFYING';
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

  console.log('listing verifying - ', listing);
  const listingStatus = getListingDraftStatus(
    listing?.status,
    listing?.isPublished,
    listing?.isVerifying,
  );
  const hasDeadlinePassed = isDeadlineOver(listing?.deadline || '');

  console.log('listingStatus', listingStatus);
  if (listingStatus === 'VERIFYING') return 'Under Verification';
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
        listing?.totalPaymentsMade !== listing?.totalWinnersSelected
      )
        return 'Payment Pending';
      if (
        listing?.isWinnersAnnounced &&
        listing?.totalPaymentsMade === listing?.totalWinnersSelected
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
    case 'Under Verification':
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

  const allRegions = CombinedRegions.find((st) => st.region === region);

  const isEligible =
    !!(userLocation && allRegions?.country.includes(userLocation)) || false;

  return isEligible;
}

export function isValidUrl(url: string): boolean {
  const urlPattern =
    /^(https?:\/\/)?(www\.)?[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+([/?].*)?$/;
  return urlPattern.test(url);
}
export function digitsInLargestString(numbers: string[]): number {
  const largest = numbers.reduce((max, current) => {
    const cleanedCurrent = current.replace(/[,\.]/g, '');
    const cleanedMax = max.replace(/[,\.]/g, '');

    return cleanedCurrent.length > cleanedMax.length
      ? current
      : cleanedCurrent.length === cleanedMax.length &&
          cleanedCurrent > cleanedMax
        ? current
        : max;
  }, '');

  return largest.replace(/[,\.]/g, '').length;
}

export function getStatusFilterQuery(statusFilter: StatusFilter | undefined) {
  let statusFilterQuery = {};

  if (statusFilter) {
    if (statusFilter === 'open') {
      statusFilterQuery = {
        deadline: {
          gte: new Date(),
        },
      };
    } else if (statusFilter === 'review') {
      statusFilterQuery = {
        deadline: {
          lte: new Date(),
        },
        isWinnersAnnounced: false,
      };
    } else if (statusFilter === 'completed') {
      statusFilterQuery = {
        isWinnersAnnounced: true,
      };
    }
  }

  return statusFilterQuery;
}

export const getListingIcon = (type: string) => {
  switch (type) {
    case 'bounty':
      return '/assets/icons/bolt.svg';
    case 'project':
      return '/assets/icons/briefcase.svg';
    case 'hackathon':
      return '/assets/icons/laptop.svg';
    case 'grant':
      return '/assets/icons/bank.svg';
    default:
      return '/assets/icons/bolt.svg';
  }
};
