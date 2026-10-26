// What the submissions review pages and the review services share: the
// shapes the pages render, and Earn's rules for winners, filters and order,
// so a button is only offered when the server would accept it.

import type {
  BountyType,
  status as ListingStatus,
  SubmissionLabels,
  SubmissionStatus,
} from '@/prisma/enums';

// Earn keeps the bonus prize under position 99.
export const BONUS_POSITION = 99;

export type Rewards = Readonly<Record<string, number>>;

export interface ReviewPayment {
  readonly txId: string;
  readonly amount: number;
  readonly tranche: number;
}

interface ReviewUser {
  readonly id: string;
  readonly firstName: string | null;
  readonly lastName: string | null;
  readonly username: string | null;
  readonly email: string;
  readonly photo: string | null;
  readonly walletAddress: string | null;
  readonly twitter: string | null;
  readonly discord: string | null;
  readonly telegram: string | null;
  readonly website: string | null;
}

export interface ReviewSubmission {
  readonly id: string;
  readonly status: SubmissionStatus;
  readonly label: SubmissionLabels;
  readonly link: string | null;
  readonly tweet: string | null;
  readonly otherInfo: string | null;
  readonly eligibilityAnswers: ReadonlyArray<{
    readonly question: string;
    readonly answer: string;
  }>;
  readonly isWinner: boolean;
  readonly winnerPosition: number | null;
  readonly isPaid: boolean;
  readonly paymentDetails: ReadonlyArray<ReviewPayment>;
  readonly notes: string | null;
  // ISO date.
  readonly createdAt: string;
  readonly user: ReviewUser;
}

export interface ReviewListing {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly type: BountyType;
  readonly status: ListingStatus;
  readonly isPublished: boolean;
  readonly isWinnersAnnounced: boolean;
  readonly isFndnPaying: boolean;
  // ISO dates.
  readonly deadline: string | null;
  readonly publishedAt: string | null;
  readonly rewards: Rewards;
  readonly maxBonusSpots: number;
  readonly token: string | null;
  readonly totalPaymentsMade: number;
  // A hackathon track's results may only be announced after this.
  readonly hackathonAnnounceDate: string | null;
}

// Rewards as Earn stores them (JSON): positions to amounts. Anything else
// is dropped.
export function rewardsOf(value: unknown): Record<string, number> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const rewards: Record<string, number> = {};
  for (const [key, amount] of Object.entries(value)) {
    if (typeof amount === 'number' && Number.isFinite(amount)) {
      rewards[key] = amount;
    }
  }
  return rewards;
}

// Ranked places, without the bonus (Earn's cleanRewards(rewards, true)).
const podiumPositions = (rewards: Rewards) =>
  Object.keys(rewards)
    .map(Number)
    .filter((key) => !Number.isNaN(key) && key !== BONUS_POSITION);

// Every position a winner can take, the bonus included, in order.
export const prizePositions = (rewards: Rewards) =>
  Object.keys(rewards)
    .map(Number)
    .filter((key) => !Number.isNaN(key))
    .toSorted((a, b) => a - b);

// How many winners a listing has: each ranked place, plus the bonus spots
// when there's a bonus (Earn's calculateTotalPrizes).
export const totalPrizes = (rewards: Rewards, maxBonusSpots: number) =>
  podiumPositions(rewards).length +
  ((rewards[BONUS_POSITION] ?? 0) > 0 ? maxBonusSpots : 0);

export interface Remainings {
  readonly podiums: number;
  readonly bonus: number;
}

// Ranked places and bonus spots still to give.
export function remainingsOf(
  listing: Pick<ReviewListing, 'rewards' | 'maxBonusSpots'>,
  submissions: ReadonlyArray<
    Pick<ReviewSubmission, 'isWinner' | 'winnerPosition'>
  >,
): Remainings {
  const winners = submissions.filter((submission) => submission.isWinner);
  const bonusWinners = winners.filter(
    (submission) => submission.winnerPosition === BONUS_POSITION,
  ).length;
  return {
    podiums:
      podiumPositions(listing.rewards).length - (winners.length - bonusWinners),
    bonus:
      ((listing.rewards[BONUS_POSITION] ?? 0) > 0 ? listing.maxBonusSpots : 0) -
      bonusWinners,
  };
}

// The review list's order: winners by place, then by decision and label.
export function sortKey(
  submission: Pick<
    ReviewSubmission,
    'isWinner' | 'winnerPosition' | 'status' | 'label'
  >,
): number {
  if (submission.isWinner) return Number(submission.winnerPosition);
  if (submission.status === 'Approved') return 100;
  if (submission.status === 'Rejected') return 900;
  switch (submission.label) {
    case 'Shortlisted':
      return 200;
    case 'Unreviewed':
      return 300;
    case 'Mid_Quality':
      return 400;
    case 'Low_Quality':
      return 500;
    case 'Reviewed':
      return 600;
    case 'Spam':
      return 1000;
    default:
      return 700;
  }
}

export type ReviewFilter = SubmissionLabels | 'Winner' | 'Rejected';

// Earn's search and label filters on the review list.
export function matchesReview(
  submission: ReviewSubmission,
  search: string,
  filters: ReadonlySet<ReviewFilter>,
): boolean {
  const { user } = submission;
  const firstName = user.firstName?.toLowerCase() ?? '';
  const lastName = user.lastName?.toLowerCase() ?? '';
  const wanted = search.toLowerCase();
  const matchesSearch =
    search === '' ||
    [
      firstName,
      lastName,
      `${firstName} ${lastName}`.trim(),
      user.email.toLowerCase(),
      user.username?.toLowerCase() ?? '',
      user.twitter?.toLowerCase() ?? '',
      user.discord?.toLowerCase() ?? '',
      submission.link?.toLowerCase() ?? '',
    ].some((field) => field.includes(wanted));
  if (!matchesSearch) return false;
  if (filters.size === 0) return true;
  return [...filters].some((filter) => {
    if (filter === 'Winner') return submission.isWinner;
    if (filter === 'Rejected') return submission.status === 'Rejected';
    // Spam shows whatever was decided.
    if (filter === 'Spam') return submission.label === 'Spam';
    if (submission.isWinner || submission.status === 'Rejected') return false;
    return submission.label === filter;
  });
}

// A payment link or bare signature, as the signature (Earn's
// normalizePaymentTxId).
export function normalizeTxId(txId: string): string {
  const trimmed = txId.trim();
  const match = (URL.parse(trimmed)?.pathname ?? trimmed).match(
    /\/tx\/([A-Za-z0-9]+)/,
  );
  return match?.[1] ?? trimmed;
}
