import { type GrantWithApplicationCount } from '@/features/grants/types';
import { type Listing } from '@/features/listings/types';

export interface CheckboxFilter {
  label: string;
  value: string;
  checked: boolean;
}

export type GrantsSearch = GrantWithApplicationCount & {
  approvedApplications: number;
  searchType: 'grants';
};

export type ListingSearch = Listing & { searchType: 'listing' };

export type SearchResult = GrantsSearch | ListingSearch;
