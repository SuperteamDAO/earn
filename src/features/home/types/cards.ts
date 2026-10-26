// What the list cards show, as the server hands them over: rows from a
// service on a page (dates as Dates), or JSON from a route handler (dates
// as strings).
type When = Date | string | null;

export interface CardSponsor {
  readonly name: string;
  readonly slug: string;
  readonly logo: string | null;
  readonly isVerified: boolean;
}

export interface ListingCardData {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly type: string;
  readonly token: string | null;
  readonly rewardAmount: number | null;
  readonly deadline: When;
  readonly winnersAnnouncedAt: When;
  readonly isWinnersAnnounced: boolean;
  readonly isFeatured: boolean | null;
  readonly compensationType: 'fixed' | 'range' | 'variable';
  readonly minRewardAsk?: number | null;
  readonly maxRewardAsk?: number | null;
  readonly _count?: { readonly Comments?: number };
  readonly sponsor: CardSponsor;
}

export interface GrantCardData {
  readonly slug: string;
  readonly title: string;
  readonly minReward: number | null;
  readonly maxReward: number | null;
  readonly token: string | null;
  readonly logo?: string | null;
  readonly isST?: boolean;
  readonly approvedAmountTotal: number;
  readonly totalApplications: number;
  readonly sponsor: CardSponsor;
}
