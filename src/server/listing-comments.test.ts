import { assert, describe, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import * as Database from '@/server/database';
import * as ListingComments from '@/server/listing-comments';
import * as Queues from '@/server/queues';

const AT = new Date('2026-10-19T12:00:00Z');

const row = (overrides: Record<string, unknown> = {}) => ({
  id: 'c-new',
  message: 'Hi',
  authorId: 'u-ada',
  refType: 'BOUNTY',
  refId: 'b1',
  isPinned: false,
  createdAt: AT,
  updatedAt: AT,
  replyToId: null,
  submissionId: null,
  type: 'NORMAL',
  author: {
    firstName: 'Ada',
    lastName: null,
    photo: null,
    username: 'ada',
    currentSponsorId: null,
  },
  replies: [],
  ...overrides,
});

interface Options {
  // The listing's poc; null for a listing without one.
  pocId?: string | null;
  // Comments the service looks up by id: its author, replyToId, listing.
  comments?: Record<
    string,
    {
      authorId: string;
      replyToId?: string | null;
      pocId?: string | null;
      refId?: string;
      refType?: string;
      isActive?: boolean;
      isArchived?: boolean;
    }
  >;
  // Users whose usernames are @mentioned, by username.
  users?: Record<string, string>;
}

// A stand-in for Prisma: only the calls the service makes.
const fakeDatabase = (options: Options = {}) => {
  const writes: Array<{ call: string; args: unknown }> = [];
  const write =
    <A>(call: string, result: (args: never) => A) =>
    async (args: never) => {
      writes.push({ call, args });
      return result(args);
    };
  const users = options.users ?? {};
  const client = {
    bounties: {
      findUnique: async () =>
        options.pocId === undefined
          ? { pocId: 'u-poc' }
          : { pocId: options.pocId },
    },
    comment: {
      findUnique: async ({ where }: { where: { id: string } }) => {
        const found = options.comments?.[where.id];
        return found
          ? {
              authorId: found.authorId,
              replyToId: found.replyToId ?? null,
              refId: found.refId ?? 'b1',
              refType: found.refType ?? 'BOUNTY',
              isActive: found.isActive ?? true,
              isArchived: found.isArchived ?? false,
              listing:
                found.pocId === undefined ? null : { pocId: found.pocId },
            }
          : null;
      },
      findMany: async () => [
        row({
          message: 'hey @grace and @nobody',
          replies: [row({ id: 'r1', message: '@ada! thanks' })],
        }),
      ],
      count: async () => 7,
      create: write(
        'comment.create',
        (args: { data: Record<string, unknown> }) => row(args.data),
      ),
      update: write('comment.update', (args: { data: { isPinned: boolean } }) =>
        row({ isPinned: args.data.isPinned }),
      ),
      deleteMany: write('comment.deleteMany', () => ({ count: 1 })),
      delete: write('comment.delete', () => row()),
    },
    user: {
      findMany: async ({
        where,
      }: {
        where: { username: { in: Array<string> }; NOT?: { id: string } };
      }) =>
        where.username.in.flatMap((username) => {
          const id = users[username];
          if (!id || id === where.NOT?.id) return [];
          return [{ id, username }];
        }),
    },
  };
  const emails: Array<Queues.EmailJob> = [];
  const layer = Layer.merge(
    Layer.succeed(
      Database.Database,
      Database.Database.of({
        query: (_operation, run) => Effect.promise(() => run(client as never)),
      }),
    ),
    Layer.succeed(
      Queues.Queues,
      Queues.Queues.of({
        email: (job) =>
          Effect.sync(() => {
            emails.push(job);
          }),
      }),
    ),
  );
  return { layer, writes, emails };
};

const run = <A, E>(
  database: ReturnType<typeof fakeDatabase>,
  use: (
    service: ListingComments.ListingComments['Service'],
  ) => Effect.Effect<A, E>,
) =>
  ListingComments.ListingComments.use(use).pipe(
    Effect.provide(ListingComments.layer.pipe(Layer.provide(database.layer))),
  );

const post = (
  database: ReturnType<typeof fakeDatabase>,
  input: Partial<ListingComments.NewComment> = {},
  userId = 'u-ada',
) =>
  run(database, (service) =>
    service.create(userId, {
      message: 'Hi',
      refId: 'b1',
      refType: 'BOUNTY',
      ...input,
    }),
  );

const sent = (database: ReturnType<typeof fakeDatabase>) =>
  database.emails.map(({ type, userId }) => `${type}:${userId ?? '-'}`);

describe('ListingComments.list', () => {
  it.effect('pages comments with dates as text and real mentions', () =>
    Effect.gen(function* () {
      const database = fakeDatabase({
        users: { grace: 'u-grace', ada: 'u-ada' },
      });
      const page = yield* run(database, (service) =>
        service.list('b1', { skip: 0, take: 10 }),
      );
      assert.strictEqual(page.count, 7);
      assert.strictEqual(page.result[0]?.createdAt, AT.toISOString());
      assert.strictEqual(
        page.result[0]?.replies?.[0]?.createdAt,
        AT.toISOString(),
      );
      assert.deepStrictEqual(page.validUsernames.toSorted(), ['ada', 'grace']);
    }),
  );
});

describe('ListingComments.create', () => {
  it.effect('tells the listing poc of a new comment', () =>
    Effect.gen(function* () {
      const database = fakeDatabase();
      const comment = yield* post(database);
      assert.strictEqual(comment.createdAt, AT.toISOString());
      assert.deepStrictEqual(sent(database), ['commentSponsor:u-poc']);
      const created = database.writes[0]?.args as {
        data: Record<string, unknown>;
      };
      assert.strictEqual(created.data.type, 'NORMAL');
      assert.strictEqual(created.data.authorId, 'u-ada');
    }),
  );

  it.effect('never emails the poc about their own comment', () =>
    Effect.gen(function* () {
      const database = fakeDatabase();
      yield* post(database, {}, 'u-poc');
      assert.deepStrictEqual(sent(database), []);
    }),
  );

  it.effect(
    'tags mentioned people, not the author, and spares a tagged poc a second email',
    () =>
      Effect.gen(function* () {
        const database = fakeDatabase({
          users: { grace: 'u-grace', ada: 'u-ada', boss: 'u-poc' },
        });
        yield* post(database, { message: 'hey @grace @ada @boss' });
        assert.deepStrictEqual(sent(database), [
          'commentTag:u-grace',
          'commentTag:u-poc',
        ]);
        assert.deepStrictEqual(database.emails[0]?.otherInfo, {
          personName: 'Ada',
          type: 'BOUNTY',
        });
      }),
  );

  it.effect(
    'emails the replied-to author, read from the comment, not the poc',
    () =>
      Effect.gen(function* () {
        const database = fakeDatabase({
          comments: { parent: { authorId: 'u-grace' } },
        });
        yield* post(database, { replyToId: 'parent' });
        assert.deepStrictEqual(sent(database), ['commentReply:u-grace']);
        const created = database.writes[0]?.args as {
          data: Record<string, unknown>;
        };
        assert.strictEqual(created.data.replyToId, 'parent');
      }),
  );

  it.effect('no reply email to oneself', () =>
    Effect.gen(function* () {
      const database = fakeDatabase({
        comments: { parent: { authorId: 'u-ada' } },
      });
      yield* post(database, { replyToId: 'parent' });
      assert.deepStrictEqual(sent(database), []);
    }),
  );

  it.effect('refuses a reply to a comment that doesn’t exist', () =>
    Effect.gen(function* () {
      const database = fakeDatabase();
      const error = yield* Effect.flip(post(database, { replyToId: 'gone' }));
      assert.strictEqual(error._tag, 'CommentNotFound');
      assert.deepStrictEqual(database.writes, []);
    }),
  );

  it.effect('refuses a reply that would cross into another thread', () =>
    Effect.gen(function* () {
      const parents = {
        otherListing: { authorId: 'u-grace', refId: 'b2' },
        otherKind: { authorId: 'u-grace', refType: 'SUBMISSION' },
        nested: { authorId: 'u-grace', replyToId: 'top' },
        archived: { authorId: 'u-grace', isArchived: true },
        inactive: { authorId: 'u-grace', isActive: false },
      };
      for (const replyToId of Object.keys(parents)) {
        const database = fakeDatabase({ comments: parents });
        const error = yield* Effect.flip(post(database, { replyToId }));
        assert.strictEqual(error._tag, 'CommentNotFound');
        assert.deepStrictEqual(database.writes, []);
        assert.deepStrictEqual(database.emails, []);
      }
    }),
  );

  it.effect('never pins a reply, even for the poc', () =>
    Effect.gen(function* () {
      const database = fakeDatabase({
        comments: { parent: { authorId: 'u-grace' } },
      });
      const error = yield* Effect.flip(
        post(database, { replyToId: 'parent', isPinned: true }, 'u-poc'),
      );
      assert.strictEqual(error._tag, 'PinRefused');
      assert.deepStrictEqual(database.writes, []);
    }),
  );

  it.effect(
    'notes activity on someone’s work, with the author for earn-emails',
    () =>
      Effect.gen(function* () {
        const database = fakeDatabase();
        yield* post(database, { refType: 'SUBMISSION', refId: 's1' });
        assert.deepStrictEqual(sent(database), ['commentActivity:-']);
        assert.deepStrictEqual(database.emails[0]?.otherInfo, {
          personName: 'Ada',
          type: 'SUBMISSION',
          authorId: 'u-ada',
        });
      }),
  );

  it.effect('lets only the listing poc pin, and only on bounties', () =>
    Effect.gen(function* () {
      const refused = yield* Effect.flip(
        post(fakeDatabase(), { isPinned: true }),
      );
      assert.strictEqual(
        refused._tag === 'PinRefused' && refused.reason,
        'Only the listing POC can pin comments',
      );
      const elsewhere = yield* Effect.flip(
        post(fakeDatabase(), { isPinned: true, refType: 'POW' }),
      );
      assert.strictEqual(
        elsewhere._tag === 'PinRefused' && elsewhere.reason,
        'Pinning is only allowed for bounty comments',
      );
      const database = fakeDatabase();
      const pinned = yield* post(database, { isPinned: true }, 'u-poc');
      assert.isTrue(pinned.isPinned);
    }),
  );
});

describe('ListingComments.remove', () => {
  it.effect('deletes the author’s comment and its replies', () =>
    Effect.gen(function* () {
      const database = fakeDatabase({
        comments: { c1: { authorId: 'u-ada' } },
      });
      yield* run(database, (service) => service.remove('u-ada', 'c1'));
      assert.deepStrictEqual(
        database.writes.map(({ call }) => call),
        ['comment.deleteMany', 'comment.delete'],
      );
    }),
  );

  it.effect('refuses anyone else', () =>
    Effect.gen(function* () {
      const database = fakeDatabase({
        comments: { c1: { authorId: 'u-ada' } },
      });
      const error = yield* Effect.flip(
        run(database, (service) => service.remove('u-mallory', 'c1')),
      );
      assert.strictEqual(error._tag, 'NotCommentAuthor');
      assert.deepStrictEqual(database.writes, []);
    }),
  );
});

describe('ListingComments.pin', () => {
  it.effect('pins for the listing poc only, never a reply', () =>
    Effect.gen(function* () {
      const database = fakeDatabase({
        comments: {
          top: { authorId: 'u-ada', pocId: 'u-poc' },
          reply: { authorId: 'u-ada', pocId: 'u-poc', replyToId: 'top' },
          feed: { authorId: 'u-ada' },
        },
      });
      const pin = (userId: string, id: string) =>
        run(database, (service) => service.pin(userId, id, true));
      const reasonOf = (userId: string, id: string) =>
        Effect.flip(pin(userId, id)).pipe(
          Effect.map((error) =>
            error._tag === 'PinRefused' ? error.reason : error._tag,
          ),
        );
      assert.strictEqual(
        yield* reasonOf('u-ada', 'top'),
        'Only the listing POC can pin comments',
      );
      assert.strictEqual(
        yield* reasonOf('u-poc', 'feed'),
        'Only the listing POC can pin comments',
      );
      assert.strictEqual(
        yield* reasonOf('u-poc', 'reply'),
        'Cannot pin replies',
      );
      assert.strictEqual(yield* reasonOf('u-poc', 'gone'), 'CommentNotFound');
      assert.deepStrictEqual(database.writes, []);
      const pinned = yield* pin('u-poc', 'top');
      assert.isTrue(pinned.isPinned);
    }),
  );
});
