import 'server-only';

import * as Clock from 'effect/Clock';
import * as Effect from 'effect/Effect';
import type { ReactNode } from 'react';

import { getViewer } from '@/lib/session';
import * as ListingLists from '@/server/listing-lists';
import { runtime } from '@/server/runtime';

import type { ListingCategory, ListingContext } from '../hooks/useListings';
import type { ListingState } from '../hooks/useListingState';
import { ListingsSectionView } from './ListingsSectionView';

export type EmptySectionFilters = {
  activeTab: string;
  activeCategory: ListingCategory;
  activeStatus: ListingState['status'];
  activeSortBy: ListingState['sortBy'];
};

type SearchParams = Readonly<Record<string, string | string[] | undefined>>;

const FOR_YOU_SUPPORTED_TYPES: ReadonlyArray<ListingContext> = ['home', 'all'];

const firstValues = (params: SearchParams) =>
  Object.fromEntries(
    Object.entries(params).map(([key, value]) => [
      key,
      Array.isArray(value) ? value[0] : value,
    ]),
  );

interface ListingsSectionProps {
  readonly type: ListingContext;
  // This page's search params: the list's filters.
  readonly searchParams: SearchParams;
  readonly region?: string;
  readonly sponsor?: string;
  // A category page's category.
  readonly category?: ListingCategory;
  readonly defaultTab?: 'bounties';
  readonly customEmptySection?: (filters: EmptySectionFilters) => ReactNode;
  // A new sponsor's "Your Bounty Here" card (the homepage).
  readonly showAddListingCard?: boolean;
}

// Earn's "Browse Opportunities" list, rendered on the server for this
// page's filters; changing them navigates (ListingsSectionView).
export async function ListingsSection({
  type,
  searchParams,
  region,
  sponsor,
  category,
  defaultTab,
  customEmptySection,
  showAddListingCard = false,
}: ListingsSectionProps) {
  const viewer = await getViewer();
  const isSponsorOrBookmarks = type === 'sponsor' || type === 'bookmarks';
  const supportsForYou = FOR_YOU_SUPPORTED_TYPES.includes(type);
  const listViewer: ListingLists.ListViewer | null =
    viewer && !viewer.isBlocked
      ? {
          id: viewer.id,
          isTalentFilled: viewer.isTalentFilled,
          location: viewer.location,
          skills: viewer.skills,
        }
      : null;

  const scope = {
    context: type,
    ...(region ? { region } : {}),
    ...(sponsor ? { sponsor } : {}),
  };

  // "For You" is the default when they have more than two there.
  const forYouCount =
    supportsForYou && listViewer
      ? await runtime.runPromise(
          ListingLists.ListingLists.use((lists) =>
            lists.counts(
              {
                ...ListingLists.LIST_DEFAULTS,
                ...scope,
                tab: defaultTab ?? 'all',
                status: 'open',
              },
              listViewer,
            ),
          ).pipe(
            Effect.map((counts) => counts['For You']),
            Effect.orElseSucceed(() => 0),
          ),
        )
      : 0;
  const showForYou = supportsForYou && !!listViewer && forYouCount > 2;

  const defaults: ListingState = {
    tab: defaultTab ?? 'all',
    category: showForYou ? 'For You' : 'All',
    status: isSponsorOrBookmarks ? 'all' : 'open',
    sortBy: isSponsorOrBookmarks ? 'Status' : 'Date',
    order: 'asc',
  };
  const state = ListingLists.pageListQuery(firstValues(searchParams), defaults);
  // Earn left the tab out of the URL when it was 'all'.
  const urlDefaults: ListingState = { ...defaults, tab: 'all' };

  const queryCategory =
    type === 'category' && category ? category : state.category;

  const [listings, now] = await Promise.all([
    viewer?.isBlocked
      ? null
      : runtime.runPromise(
          ListingLists.ListingLists.use((lists) =>
            lists.list(
              { ...state, ...scope, category: queryCategory },
              listViewer,
            ),
          ).pipe(Effect.orElseSucceed(() => null)),
        ),
    runtime.runPromise(Clock.currentTimeMillis),
  ]);

  const effectiveCategory =
    type === 'category' && category
      ? category
      : type === 'bookmarks' && state.category === 'For You'
        ? 'All'
        : state.category;

  return (
    <ListingsSectionView
      type={type}
      listings={listings}
      now={now}
      state={state}
      defaults={urlDefaults}
      category={category}
      showForYou={showForYou}
      showAddListingCard={showAddListingCard}
      emptySection={customEmptySection?.({
        activeTab: state.tab,
        activeCategory: effectiveCategory,
        activeStatus: state.status,
        activeSortBy: state.sortBy,
      })}
    />
  );
}
