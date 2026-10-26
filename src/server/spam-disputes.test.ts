import { assert, describe, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';
import * as Layer from 'effect/Layer';
import { TestClock } from 'effect/testing';

import * as Credits from '@/server/credits';
import * as Database from '@/server/database';
import * as Earncognito from '@/server/earncognito';
import * as SpamDisputes from '@/server/spam-disputes';

const NOW = Date.parse('2026-10-26T12:00:00Z');
const DAY = 24 * 60 * 60 * 1000;

interface Setup {
  readonly existingDispute?: boolean;
  readonly penaltyAgeDays?: number | null;
  readonly earncognitoStatus?: number;
}

const world = ({
  existingDispute = false,
  penaltyAgeDays = 2,
  earncognitoStatus,
}: Setup = {}) => {
  const posts: Array<{ path: string; body: unknown }> = [];
  const disputes: Array<[string, string, string]> = [];
  const where: Array<unknown> = [];
  const layer = SpamDisputes.layer.pipe(
    Layer.provide(
      Layer.mergeAll(
        Layer.succeed(
          Database.Database,
          Database.Database.of({
            query: (_operation, run) =>
              Effect.promise(() =>
                run({
                  creditLedger: {
                    findFirst: async (args: {
                      where: { type: { in: ReadonlyArray<string> } };
                    }) => {
                      where.push(args.where);
                      if (args.where.type.in.includes('SPAM_DISPUTE')) {
                        return existingDispute ? { id: 'dispute' } : null;
                      }
                      return penaltyAgeDays === null
                        ? null
                        : { createdAt: new Date(NOW - penaltyAgeDays * DAY) };
                    },
                  },
                  user: {
                    findUnique: async () => ({ email: 'ada@example.com' }),
                  },
                  submission: {
                    findFirst: async () => ({
                      listing: { title: 'A bounty', slug: 'a-bounty' },
                    }),
                  },
                  grantApplication: {
                    findFirst: async () => ({
                      grant: { title: 'A grant', slug: 'a-grant' },
                    }),
                  },
                } as never),
              ),
          }),
        ),
        Layer.succeed(
          Earncognito.Earncognito,
          Earncognito.Earncognito.of({
            post: (path, body) =>
              earncognitoStatus
                ? Effect.fail(
                    new Earncognito.EarncognitoError({
                      path,
                      status: earncognitoStatus,
                    }),
                  )
                : Effect.sync(() => {
                    posts.push({ path, body });
                    return null;
                  }),
          }),
        ),
        Layer.succeed(
          Credits.Credits,
          Credits.Credits.of({
            dispute: (userId: string, kind: string, id: string) =>
              Effect.sync(() => {
                disputes.push([userId, kind, id]);
              }),
          } as unknown as Credits.Credits['Service']),
        ),
      ),
    ),
  );
  return { layer, posts, disputes, where };
};

const dispute = (
  setup: ReturnType<typeof world>,
  listingType = 'BOUNTY',
  submissionId = 'submission',
) =>
  Effect.gen(function* () {
    yield* TestClock.setTime(NOW);
    return yield* SpamDisputes.SpamDisputes.use((disputes) =>
      disputes.dispute('user', {
        description: 'I did the work, honestly.',
        listingType,
        submissionId,
      }),
    );
  }).pipe(Effect.provide(setup.layer), Effect.exit);

const reasonOf = <A, E>(exit: Exit.Exit<A, E>) =>
  Exit.isFailure(exit) ? JSON.stringify(exit.cause) : 'succeeded';

describe('SpamDisputes.dispute', () => {
  it.effect('tells the team, then records a pending dispute', () =>
    Effect.gen(function* () {
      const setup = world();
      const exit = yield* dispute(setup);
      assert.isTrue(Exit.isSuccess(exit));
      assert.deepStrictEqual(setup.posts, [
        {
          path: '/telegram/spam-dispute',
          body: {
            listingTitle: 'A bounty',
            listingUrl: 'https://superteam.fun/earn/listing/a-bounty',
            description: 'I did the work, honestly.',
            userEmail: 'ada@example.com',
            submissionId: 'submission',
            listingType: 'BOUNTY',
          },
        },
      ]);
      assert.deepStrictEqual(setup.disputes, [
        ['user', 'submission', 'submission'],
      ]);
    }),
  );

  it.effect('disputes a grant application by its id', () =>
    Effect.gen(function* () {
      const setup = world();
      yield* dispute(setup, 'GRANT', 'application');
      assert.deepStrictEqual(setup.where[0], {
        applicationId: 'application',
        userId: 'user',
        type: { in: ['SPAM_DISPUTE', 'GRANT_SPAM_DISPUTE'] },
      });
      const body = setup.posts[0]?.body as { listingUrl: string };
      assert.strictEqual(
        body.listingUrl,
        'https://superteam.fun/earn/grants/a-grant',
      );
      assert.deepStrictEqual(setup.disputes, [
        ['user', 'application', 'application'],
      ]);
    }),
  );

  it.effect('refuses a second dispute, no penalty, or a late one', () =>
    Effect.gen(function* () {
      for (const [setup, reason] of [
        [{ existingDispute: true }, 'duplicate'],
        [{ penaltyAgeDays: null }, 'no-penalty'],
        [{ penaltyAgeDays: 8 }, 'expired'],
      ] as const) {
        const state = world(setup);
        assert.include(reasonOf(yield* dispute(state)), reason);
        assert.lengthOf(state.posts, 0);
        assert.lengthOf(state.disputes, 0);
      }
      // A week to the day still counts.
      assert.isTrue(
        Exit.isSuccess(yield* dispute(world({ penaltyAgeDays: 7.9 }))),
      );
    }),
  );

  it.effect('records nothing when earncognito refuses', () =>
    Effect.gen(function* () {
      const setup = world({ earncognitoStatus: 502 });
      assert.include(reasonOf(yield* dispute(setup)), 'EarncognitoError');
      assert.lengthOf(setup.disputes, 0);
    }),
  );
});
