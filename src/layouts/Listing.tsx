import 'server-only';

import * as Clock from 'effect/Clock';
import * as Effect from 'effect/Effect';
import { cache } from 'react';

import { Default } from '@/layouts/Default';
import { getSession, getViewer } from '@/lib/session';
import * as Credits from '@/server/credits';
import * as ListingBookmarks from '@/server/listing-bookmarks';
import * as ListingComments from '@/server/listing-comments';
import * as ListingDetails from '@/server/listing-details';
import { runtime } from '@/server/runtime';

import {
  type ListingPageData,
  ListingPageFrame,
} from '@/features/listings/components/ListingPage/ListingPageFrame';
import type { PublicListing } from '@/features/listings/types';

// A listing's announced winners, loaded once per request however many parts
// of the page show them.
export const listingWinners = cache((listingId: string) =>
  runtime.runPromise(
    ListingDetails.ListingDetails.use((details) =>
      details.winners(listingId),
    ).pipe(Effect.orElseSucceed(() => [])),
  ),
);

const EMPTY: ListingPageData = {
  submissionNumber: 0,
  winners: [],
  comments: undefined,
  bookmarks: { count: 0, bookmarked: false },
  chapters: [],
  submission: null,
  creditBalance: 0,
  related: [],
  now: 0,
};

// Everything around the page itself, for this listing and whoever's looking.
// A part that fails to load shows empty, as Earn's client queries did.
async function pageData(
  listing: PublicListing,
  isTemplate: boolean,
): Promise<ListingPageData> {
  const [viewer, session] = await Promise.all([getViewer(), getSession()]);
  const listingId = listing.id;
  const now = await runtime.runPromise(Clock.currentTimeMillis);
  if (!listingId) return { ...EMPTY, now };
  const [winners, rest] = await Promise.all([
    listing.isWinnersAnnounced ? listingWinners(listingId) : [],
    runtime.runPromise(
      Effect.all(
        {
          submissionNumber: ListingDetails.ListingDetails.use((details) =>
            details.submissionCount(listingId),
          ).pipe(Effect.orElseSucceed(() => 0)),
          comments: ListingComments.ListingComments.use((comments) =>
            comments.list(listingId, { skip: 0, take: 10 }),
          ).pipe(
            Effect.map((page): ListingPageData['comments'] => page),
            Effect.orElseSucceed(() => undefined),
          ),
          bookmarks: ListingBookmarks.ListingBookmarks.use((bookmarks) =>
            bookmarks.summary(listingId, session?.userId ?? null),
          ).pipe(Effect.orElseSucceed(() => EMPTY.bookmarks)),
          chapters: ListingDetails.ListingDetails.use(
            (details) => details.chapters,
          ).pipe(Effect.orElseSucceed(() => [])),
          submission: viewer
            ? ListingDetails.ListingDetails.use((details) =>
                details.viewerEntry(viewer.id, listingId),
              ).pipe(Effect.orElseSucceed(() => null))
            : Effect.succeed(null),
          creditBalance: viewer?.isTalentFilled
            ? Credits.Credits.use((credits) => credits.balance(viewer.id)).pipe(
                Effect.orElseSucceed(() => 0),
              )
            : Effect.succeed(0),
          related:
            isTemplate || viewer?.isBlocked
              ? Effect.succeed([])
              : ListingDetails.ListingDetails.use((details) =>
                  details.sidebar(
                    {
                      id: listingId,
                      sponsorId: listing.sponsorId,
                      hackathonId: listing.hackathonId,
                      sponsor: listing.sponsor,
                    },
                    viewer?.location ?? null,
                  ),
                ).pipe(Effect.orElseSucceed(() => [])),
        },
        { concurrency: 'unbounded' },
      ),
    ),
  ]);
  return { ...rest, winners, now };
}

interface ListingPageProps {
  listing: PublicListing | null;
  children: React.ReactNode;
  maxW?: '7xl' | '6xl' | '5xl' | '4xl' | '3xl' | '2xl' | 'xl' | 'lg' | 'md';
  isTemplate?: boolean;
}

// Earn's listing layout, on the server: the shell, then the listing's frame
// with its data. Pages export their own metadata (see listingMetadata).
export async function ListingPageLayout({
  listing,
  children,
  maxW = '7xl',
  isTemplate = false,
}: ListingPageProps) {
  const data = listing ? await pageData(listing, isTemplate) : EMPTY;
  return (
    <Default>
      <ListingPageFrame
        listing={listing}
        maxW={maxW}
        isTemplate={isTemplate}
        data={data}
      >
        {children}
      </ListingPageFrame>
    </Default>
  );
}
