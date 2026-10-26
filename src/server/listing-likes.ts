import 'server-only';

import * as Clock from 'effect/Clock';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import * as Database from '@/server/database';

// A type, not an interface, so Prisma takes it as JSON.
type Like = { readonly id: string; readonly date: number };

const isLike = (value: unknown): value is Like =>
  typeof value === 'object' &&
  value !== null &&
  'id' in value &&
  typeof value.id === 'string';

// The likes after `userId` taps like: theirs added, or taken back (Earn's
// updateLike).
export function toggledLikes(
  current: unknown,
  userId: string,
  now: number,
): Array<Like> {
  const likes = Array.isArray(current) ? current.filter(isLike) : [];
  return likes.some((like) => like.id === userId)
    ? likes.filter((like) => like.id !== userId)
    : [...likes, { id: userId, date: now }];
}

// Likes on a listing's submissions, as Earn's submission like (no email).
export class ListingLikes extends Context.Service<
  ListingLikes,
  {
    // Succeeds with whether it is now liked by them. A submission that
    // doesn't exist fails like Earn's update did.
    readonly toggleSubmission: (
      userId: string,
      submissionId: string,
    ) => Effect.Effect<boolean, Database.DatabaseError>;
  }
>()('earn/ListingLikes') {}

const make = Effect.gen(function* () {
  const database = yield* Database.Database;

  const toggleSubmission = Effect.fn('ListingLikes.toggleSubmission')(
    function* (userId: string, submissionId: string) {
      const now = yield* Clock.currentTimeMillis;
      const submission = yield* database.query('likedSubmission', (client) =>
        client.submission.findFirst({
          where: { id: submissionId },
          select: { like: true },
        }),
      );
      const likes = toggledLikes(submission?.like, userId, now);
      yield* database.query('likeSubmission', (client) =>
        client.submission.update({
          where: { id: submissionId },
          data: { like: likes, likeCount: likes.length },
          select: { id: true },
        }),
      );
      return likes.some((like) => like.id === userId);
    },
  );

  return ListingLikes.of({ toggleSubmission });
});

export const layer = Layer.effect(ListingLikes, make);
