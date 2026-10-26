import type {
  GrantCardData,
  ListingCardData,
} from '@/features/home/types/cards';

export type GrantsSearch = GrantCardData & {
  readonly id: string;
  readonly approvedApplications: number;
  readonly searchType: 'grants';
};

export type ListingSearch = ListingCardData & {
  readonly searchType: 'listing';
};

export type SearchResult = GrantsSearch | ListingSearch;

// /api/search/[query]'s answer.
export interface SearchPage {
  readonly results: ReadonlyArray<SearchResult>;
  // Bounties and grants matching, in all.
  readonly count: string;
  readonly bountiesCount: number;
  readonly grantsCount: number;
}
