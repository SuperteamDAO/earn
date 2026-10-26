import * as Clock from 'effect/Clock';
import * as Effect from 'effect/Effect';
import type { Metadata } from 'next';

import { ASSET_URL } from '@/constants/ASSET_URL';
import { Default } from '@/layouts/Default';
import { pageMetadata } from '@/lib/metadata';
import { getSession } from '@/lib/session';
import * as ListingSearch from '@/server/listing-search';
import { runtime } from '@/server/runtime';
import { generateWebSiteSchema } from '@/utils/json-ld';

import { SearchView } from '@/features/search/components/SearchView';

type Props = PageProps<'/earn/search'>;

const first = (value: string | string[] | undefined) =>
  (Array.isArray(value) ? value[0] : value) ?? '';

const queryOf = async (searchParams: Props['searchParams']) =>
  first((await searchParams).q).trim();

export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  const searchTerm = await queryOf(searchParams);
  return pageMetadata({
    title: searchTerm
      ? `Search: ${searchTerm} | Superteam Earn`
      : 'Search | Superteam Earn',
    description: searchTerm
      ? `Search results for "${searchTerm}" on Superteam Earn`
      : 'Search for bounties, grants, and opportunities on Superteam Earn',
    canonical: 'https://superteam.fun/earn/search/',
    og: `${ASSET_URL}/og/og.png`,
    noIndex: true,
  });
}

// Earn's JsonLd, inline: the App Router hoists nothing, and the script
// works in the body as well.
const websiteJsonLd = JSON.stringify(generateWebSiteSchema()).replace(
  /</g,
  '\\u003c',
);

export default async function SearchPage({ searchParams }: Props) {
  const params = await searchParams;
  const initialQuery = first(params.q).trim();
  const urlParams = new URLSearchParams();
  for (const key of ['q', 'status', 'skills'] as const) {
    const value = first(params[key]);
    if (value) urlParams.set(key, value);
  }

  const session = await getSession();
  const [firstPage, now] = await Promise.all([
    initialQuery ? firstPageOf(initialQuery, urlParams, session?.userId) : null,
    runtime.runPromise(Clock.currentTimeMillis),
  ]);

  return (
    <Default>
      <script
        type="application/ld+json"
        // JSON with `<` escaped, so it can't close the script.
        // oxlint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: websiteJsonLd }}
      />
      {/* A new search is a new page: its state starts from the URL. */}
      <SearchView
        key={urlParams.toString()}
        initialQuery={initialQuery}
        firstPage={firstPage}
        now={now}
      />
    </Default>
  );
}

// The first page, as Earn's search page asked for it (10 bounties, 3
// grants); null if the search fails.
function firstPageOf(
  query: string,
  urlParams: URLSearchParams,
  privyDid: string | undefined,
) {
  const search = new URLSearchParams(urlParams);
  search.delete('q');
  search.set('bountiesLimit', '10');
  search.set('grantsLimit', '3');
  const parsed = ListingSearch.parseSearchParams(query, search);
  if (parsed instanceof ListingSearch.InvalidSearch) return null;
  return runtime.runPromise(
    ListingSearch.ListingSearch.use((listings) =>
      listings.search(parsed, privyDid ?? null),
    ).pipe(Effect.orElseSucceed(() => null)),
  );
}
