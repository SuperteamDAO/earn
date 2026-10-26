import 'server-only';

import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Schema from 'effect/Schema';

import type { CommentRefType } from '@/prisma/enums';
import * as Database from '@/server/database';
import * as Queues from '@/server/queues';

import type { Comment, CommentsPage } from '@/features/comments/types';

export type { Comment, CommentsPage };

export class CommentNotFound extends Schema.TaggedError<CommentNotFound>()(
  'CommentNotFound',
  { id: Schema.String },
) {
  override get message() {
    return `No comment ${this.id}`;
  }
}

// Only a comment's author may delete it.
export class NotCommentAuthor extends Schema.TaggedError<NotCommentAuthor>()(
  'NotCommentAuthor',
  {},
) {
  override get message() {
    return 'Only the author may delete a comment';
  }
}

// Pinning is the listing poc's, on a bounty's top-level comments. `reason`
// is Earn's answer, word for word.
export class PinRefused extends Schema.TaggedError<PinRefused>()('PinRefused', {
  reason: Schema.Literals([
    'Only the listing POC can pin comments',
    'Pinning is only allowed for bounty comments',
    'Cannot pin replies',
  ]),
}) {
  override get message() {
    return `Pin refused: ${this.reason}`;
  }
}

export interface NewComment {
  readonly message: string;
  readonly refId: string;
  readonly refType: CommentRefType;
  readonly replyToId?: string | null;
  readonly isPinned?: boolean;
}

export class ListingComments extends Context.Service<
  ListingComments,
  {
    // A thing's top-level comments, pinned first then newest, with their
    // replies, the total, and which @mentions name real people.
    readonly list: (
      refId: string,
      options: { readonly skip: number; readonly take: number },
    ) => Effect.Effect<CommentsPage, Database.DatabaseError>;
    // Posts a comment (or a reply) as `userId` and queues Earn's emails:
    // mentions, the reply's author, the listing's poc or the item's owner.
    readonly create: (
      userId: string,
      input: NewComment,
    ) => Effect.Effect<
      Comment,
      CommentNotFound | PinRefused | Database.DatabaseError
    >;
    // Deletes the author's own comment and its replies.
    readonly remove: (
      userId: string,
      id: string,
    ) => Effect.Effect<
      void,
      CommentNotFound | NotCommentAuthor | Database.DatabaseError
    >;
    readonly pin: (
      userId: string,
      id: string,
      isPinned: boolean,
    ) => Effect.Effect<
      Comment,
      CommentNotFound | PinRefused | Database.DatabaseError
    >;
  }
>()('earn/ListingComments') {}

const AUTHOR = {
  firstName: true,
  lastName: true,
  photo: true,
  username: true,
  currentSponsorId: true,
} as const;

const FIELDS = {
  id: true,
  message: true,
  authorId: true,
  refType: true,
  refId: true,
  isPinned: true,
  createdAt: true,
  updatedAt: true,
  replyToId: true,
  submissionId: true,
  type: true,
  author: { select: AUTHOR },
} as const;

const WITH_REPLIES = {
  ...FIELDS,
  replies: { select: FIELDS, orderBy: { createdAt: 'asc' } },
} as const;

// The comments a thread shows: live, top-level, not the automatic
// "submitted" notes.
const THREAD = (refId: string) =>
  ({
    refId,
    isActive: true,
    isArchived: false,
    replyToId: null,
    type: { not: 'SUBMISSION' },
  }) as const;

interface Row {
  readonly id: string;
  readonly message: string;
  readonly authorId: string;
  readonly refType: CommentRefType;
  readonly refId: string;
  readonly isPinned: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly replyToId: string | null;
  readonly submissionId: string | null;
  readonly type: Comment['type'];
  readonly author: Comment['author'];
  readonly replies?: ReadonlyArray<Row>;
}

const toComment = ({ replies, ...row }: Row): Comment => ({
  ...row,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
  ...(replies ? { replies: replies.map(toComment) } : {}),
});

const USERNAME = /^[a-zA-Z0-9_-]+$/;

// Usernames @mentioned in comments and their replies.
function mentionedUsernames(comments: ReadonlyArray<Row>): Array<string> {
  const usernames = new Set<string>();
  const scan = (message: string) => {
    for (const match of message.match(/@([\w-]+)/g) ?? []) {
      const username = match.slice(1);
      if (username && USERNAME.test(username)) usernames.add(username);
    }
  };
  for (const comment of comments) {
    scan(comment.message);
    for (const reply of comment.replies ?? []) scan(reply.message);
  }
  return [...usernames];
}

const make = Effect.gen(function* () {
  const database = yield* Database.Database;
  const queues = yield* Queues.Queues;

  const list = Effect.fn('ListingComments.list')(function* (
    refId: string,
    { skip, take }: { readonly skip: number; readonly take: number },
  ) {
    const [result, count] = yield* Effect.all(
      [
        database.query('comments', (client) =>
          client.comment.findMany({
            where: THREAD(refId),
            orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
            skip,
            take,
            select: WITH_REPLIES,
          }),
        ),
        database.query('commentCount', (client) =>
          client.comment.count({ where: THREAD(refId) }),
        ),
      ],
      { concurrency: 'unbounded' },
    );
    const mentioned = mentionedUsernames(result);
    const valid =
      mentioned.length > 0
        ? yield* database.query('mentionedUsers', (client) =>
            client.user.findMany({
              where: { username: { in: mentioned } },
              select: { username: true },
            }),
          )
        : [];
    return {
      count,
      result: result.map(toComment),
      validUsernames: valid.flatMap(({ username }) =>
        username ? [username] : [],
      ),
    } satisfies CommentsPage;
  });

  // The listing's poc, who alone pins and hears of new comments.
  const pocOf = (refId: string) =>
    database
      .query('commentListingPoc', (client) =>
        client.bounties.findUnique({
          where: { id: refId },
          select: { pocId: true },
        }),
      )
      .pipe(Effect.map((listing) => listing?.pocId ?? null));

  const create = Effect.fn('ListingComments.create')(function* (
    userId: string,
    input: NewComment,
  ) {
    const { message, refId, refType } = input;
    const replyToId = input.replyToId || null;
    const isPinned = input.isPinned ?? false;

    const pocId = refType === 'BOUNTY' ? yield* pocOf(refId) : null;
    // Only top-level comments are pinned.
    if (isPinned && replyToId) {
      return yield* new PinRefused({ reason: 'Cannot pin replies' });
    }
    if (isPinned) {
      if (refType !== 'BOUNTY') {
        return yield* new PinRefused({
          reason: 'Pinning is only allowed for bounty comments',
        });
      }
      if (pocId !== userId) {
        return yield* new PinRefused({
          reason: 'Only the listing POC can pin comments',
        });
      }
    }

    // Whom a reply answers: the author of the comment it hangs off, as
    // Earn's UI sends it, but read here rather than taken from the client.
    let replyToUserId: string | null = null;
    if (replyToId) {
      const parent = yield* database.query('replyTarget', (client) =>
        client.comment.findUnique({
          where: { id: replyToId },
          select: {
            authorId: true,
            refId: true,
            refType: true,
            replyToId: true,
            isActive: true,
            isArchived: true,
          },
        }),
      );
      // Earn's threads are one level deep, on the same thing: a reply hangs
      // off a live top-level comment of the thread it's posted to.
      if (
        !parent ||
        parent.refId !== refId ||
        parent.refType !== refType ||
        parent.replyToId !== null ||
        !parent.isActive ||
        parent.isArchived
      ) {
        return yield* new CommentNotFound({ id: replyToId });
      }
      replyToUserId = parent.authorId;
    }

    const created = yield* database.query('createComment', (client) =>
      client.comment.create({
        data: {
          authorId: userId,
          message,
          replyToId,
          refId,
          refType,
          type: 'NORMAL',
          isPinned,
        },
        select: WITH_REPLIES,
      }),
    );

    const tagged = message
      .split(' ')
      .filter((word) => word.startsWith('@'))
      .map((word) => word.substring(1));
    const taggedUsers =
      tagged.length > 0
        ? yield* database.query('taggedUsers', (client) =>
            client.user.findMany({
              where: { username: { in: tagged }, NOT: { id: userId } },
              select: { id: true },
            }),
          )
        : [];
    const personName = created.author.firstName;

    for (const taggedUser of taggedUsers) {
      yield* queues.email({
        type: 'commentTag',
        id: refId,
        userId: taggedUser.id,
        otherInfo: { personName, type: refType },
      });
    }
    if (replyToUserId && replyToUserId !== userId) {
      yield* queues.email({
        type: 'commentReply',
        id: refId,
        userId: replyToUserId,
        otherInfo: { type: refType },
      });
    }
    const pocTagged = taggedUsers.some((user) => user.id === pocId);
    if (!replyToId && userId !== pocId && !pocTagged) {
      if (refType === 'BOUNTY' && pocId) {
        yield* queues.email({
          type: 'commentSponsor',
          id: refId,
          userId: pocId,
        });
      }
      if (refType !== 'BOUNTY') {
        yield* queues.email({
          type: 'commentActivity',
          id: refId,
          // earn-emails skips the email when the commenter owns the item.
          otherInfo: { personName, type: refType, authorId: userId },
        });
      }
    }

    return toComment(created);
  });

  const remove = Effect.fn('ListingComments.remove')(function* (
    userId: string,
    id: string,
  ) {
    const comment = yield* database.query('commentToDelete', (client) =>
      client.comment.findUnique({ where: { id }, select: { authorId: true } }),
    );
    if (!comment) return yield* new CommentNotFound({ id });
    if (comment.authorId !== userId) return yield* new NotCommentAuthor();
    // Its replies first: they point at it.
    yield* database.query('deleteReplies', (client) =>
      client.comment.deleteMany({ where: { replyToId: id } }),
    );
    return yield* database
      .query('deleteComment', (client) =>
        client.comment.delete({ where: { id } }),
      )
      .pipe(Effect.asVoid);
  });

  const pin = Effect.fn('ListingComments.pin')(function* (
    userId: string,
    id: string,
    isPinned: boolean,
  ) {
    const comment = yield* database.query('commentToPin', (client) =>
      client.comment.findUnique({
        where: { id },
        select: { replyToId: true, listing: { select: { pocId: true } } },
      }),
    );
    if (!comment) return yield* new CommentNotFound({ id });
    if (comment.listing?.pocId !== userId) {
      return yield* new PinRefused({
        reason: 'Only the listing POC can pin comments',
      });
    }
    if (comment.replyToId) {
      return yield* new PinRefused({ reason: 'Cannot pin replies' });
    }
    const updated = yield* database.query('pinComment', (client) =>
      client.comment.update({
        where: { id },
        data: { isPinned },
        select: FIELDS,
      }),
    );
    return toComment(updated);
  });

  return ListingComments.of({ list, create, remove, pin });
});

export const layer = Layer.effect(ListingComments, make);
