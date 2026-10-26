import 'server-only';

import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Schema from 'effect/Schema';

import * as Database from '@/server/database';

export class BookmarksBlocked extends Schema.TaggedError<BookmarksBlocked>()(
  'BookmarksBlocked',
  {},
) {
  override get message() {
    return 'User is blocked';
  }
}

export interface BookmarkSummary {
  // Bookmarks that stand (not archived).
  readonly count: number;
  readonly bookmarked: boolean;
}

export interface BookmarkEntry {
  readonly bountyId: string;
  // The viewer's own id on their own bookmark; blank on everyone else's.
  readonly userId: string;
}

export interface BookmarkRow {
  readonly id: string;
  readonly bountyId: string;
  readonly userId: string;
  readonly isArchived: boolean;
}

// Bookmarks on a listing (Earn's SubscribeBounty rows).
export class ListingBookmarks extends Context.Service<
  ListingBookmarks,
  {
    // For the listing page. A blocked viewer counts as signed out.
    readonly summary: (
      listingId: string,
      privyDid: string | null,
    ) => Effect.Effect<BookmarkSummary, Database.DatabaseError>;
    // Earn's GET /api/listings/bookmark/status: every standing bookmark, ids
    // other than the viewer's blanked.
    readonly statusList: (
      listingId: string,
      privyDid: string | null,
    ) => Effect.Effect<
      ReadonlyArray<BookmarkEntry>,
      BookmarksBlocked | Database.DatabaseError
    >;
    // Bookmarks it, or flips an existing bookmark's archived state.
    readonly toggle: (
      userId: string,
      listingId: string,
    ) => Effect.Effect<BookmarkRow, Database.DatabaseError>;
  }
>()('earn/ListingBookmarks') {}

const make = Effect.gen(function* () {
  const database = yield* Database.Database;

  const viewerOf = (privyDid: string | null) =>
    privyDid
      ? database.query('bookmarkViewer', (client) =>
          client.user.findUnique({
            where: { privyDid },
            select: { id: true, isBlocked: true },
          }),
        )
      : Effect.succeed(null);

  const standing = (listingId: string) =>
    database.query('listingBookmarks', (client) =>
      client.subscribeBounty.findMany({
        where: { bountyId: listingId, isArchived: false },
        select: { bountyId: true, userId: true },
      }),
    );

  const summary = Effect.fn('ListingBookmarks.summary')(function* (
    listingId: string,
    privyDid: string | null,
  ) {
    const [rows, viewer] = yield* Effect.all(
      [standing(listingId), viewerOf(privyDid)],
      { concurrency: 'unbounded' },
    );
    const userId = viewer && !viewer.isBlocked ? viewer.id : null;
    return {
      count: rows.length,
      bookmarked: !!userId && rows.some((row) => row.userId === userId),
    } satisfies BookmarkSummary;
  });

  const statusList = Effect.fn('ListingBookmarks.statusList')(function* (
    listingId: string,
    privyDid: string | null,
  ) {
    const [rows, viewer] = yield* Effect.all(
      [standing(listingId), viewerOf(privyDid)],
      { concurrency: 'unbounded' },
    );
    if (viewer?.isBlocked) return yield* new BookmarksBlocked();
    const userId = viewer?.id ?? null;
    return rows.map((row) => ({
      bountyId: row.bountyId,
      userId: userId && row.userId === userId ? row.userId : '',
    }));
  });

  const toggle = Effect.fn('ListingBookmarks.toggle')(function* (
    userId: string,
    listingId: string,
  ) {
    const found = yield* database.query('findBookmark', (client) =>
      client.subscribeBounty.findFirst({
        where: { bountyId: listingId, userId },
        select: { id: true, isArchived: true },
      }),
    );
    const select = {
      id: true,
      bountyId: true,
      userId: true,
      isArchived: true,
    } as const;
    if (found) {
      return yield* database.query('flipBookmark', (client) =>
        client.subscribeBounty.update({
          where: { id: found.id },
          data: { isArchived: !found.isArchived },
          select,
        }),
      );
    }
    return yield* database.query('createBookmark', (client) =>
      client.subscribeBounty.create({
        data: { bountyId: listingId, userId },
        select,
      }),
    );
  });

  return ListingBookmarks.of({ summary, statusList, toggle });
});

export const layer = Layer.effect(ListingBookmarks, make);
