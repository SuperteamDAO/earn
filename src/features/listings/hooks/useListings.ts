// The list parameters' types, from the list service (the data itself is
// loaded on the server now).
import type {
  ListCategory,
  ListContext,
  ListOrder,
  ListSort,
  ListStatus,
} from '@/server/listing-lists';

// 'all', 'bounties', or a hackathon's slug.
export type ListingTab = string;
export type ListingCategory = ListCategory;
export type ListingStatus = ListStatus;
export type ListingSortOption = ListSort;
export type OrderDirection = ListOrder;
export type ListingContext = ListContext;
