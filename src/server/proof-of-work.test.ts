import { assert, describe, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { TestClock } from 'effect/testing';

import * as Database from '@/server/database';
import * as ProofOfWork from '@/server/proof-of-work';

const NOW = Date.parse('2026-10-26T12:00:00Z');

// A stand-in for Prisma's PoW table.
const setup = (rows: Array<{ id: string; like?: unknown }>) => {
  const writes: Array<{ op: string; args: unknown }> = [];
  const record = (op: string) => async (args: unknown) => {
    writes.push({ op, args });
    return {};
  };
  const tx = {
    poW: {
      findMany: async () => rows.map(({ id }) => ({ id })),
      findUnique: async ({ where }: { where: { id: string } }) =>
        rows.find((row) => row.id === where.id) ?? null,
      createMany: record('createMany'),
      deleteMany: record('deleteMany'),
      update: record('update'),
    },
  };
  const client = {
    ...tx,
    $transaction: async (run: (transaction: typeof tx) => Promise<unknown>) =>
      run(tx),
  };
  const layer = ProofOfWork.layer.pipe(
    Layer.provide(
      Layer.succeed(
        Database.Database,
        Database.Database.of({
          query: (_operation, run) =>
            Effect.promise(() => run(client as never)),
        }),
      ),
    ),
  );
  const run = <A, E>(
    use: (pow: ProofOfWork.ProofOfWork['Service']) => Effect.Effect<A, E>,
  ) =>
    Effect.gen(function* () {
      yield* TestClock.setTime(NOW);
      return yield* ProofOfWork.ProofOfWork.use(use);
    }).pipe(Effect.provide(layer));
  return { run, writes };
};

const project = (id?: string) => ({
  ...(id ? { id } : {}),
  title: 'Wallet',
  description: 'A wallet',
  skills: ['Frontend'],
  subSkills: ['React'],
  link: 'https://example.com',
});

describe('ProofOfWork.replace', () => {
  it.effect('updates sent ones, adds new ones, deletes the rest', () =>
    Effect.gen(function* () {
      const fake = setup([{ id: 'p1' }, { id: 'p2' }]);
      yield* fake.run((pow) => pow.replace('u1', [project('p1'), project()]));
      assert.deepStrictEqual(
        fake.writes.map((write) => write.op),
        ['deleteMany', 'createMany', 'update'],
      );
      assert.deepStrictEqual(fake.writes[0]?.args, {
        where: { userId: 'u1', id: { in: ['p2'] } },
      });
    }),
  );

  it.effect('refuses someone else’s project, changing nothing', () =>
    Effect.gen(function* () {
      const fake = setup([{ id: 'p1' }]);
      const error = yield* fake
        .run((pow) => pow.replace('u1', [project('theirs')]))
        .pipe(Effect.flip);
      assert.strictEqual(error._tag, 'ProjectsRefused');
      assert.deepStrictEqual(fake.writes, []);
    }),
  );
});

describe('ProofOfWork.toggleLike', () => {
  it.effect('adds a dated like, as earn-emails reads them', () =>
    Effect.gen(function* () {
      const fake = setup([{ id: 'p1', like: [{ id: 'u2', date: 1 }] }]);
      const result = yield* fake.run((pow) => pow.toggleLike('u1', 'p1'));
      assert.isTrue(result.liked);
      assert.deepStrictEqual(fake.writes[0]?.args, {
        where: { id: 'p1' },
        data: {
          like: [
            { id: 'u2', date: 1 },
            { id: 'u1', date: NOW },
          ],
          likeCount: 2,
        },
      });
    }),
  );

  it.effect('takes their like back', () =>
    Effect.gen(function* () {
      const fake = setup([{ id: 'p1', like: [{ id: 'u1', date: 1 }] }]);
      const result = yield* fake.run((pow) => pow.toggleLike('u1', 'p1'));
      assert.isFalse(result.liked);
      assert.deepStrictEqual(fake.writes[0]?.args, {
        where: { id: 'p1' },
        data: { like: [], likeCount: 0 },
      });
    }),
  );

  it.effect('refuses a project that isn’t there', () =>
    Effect.gen(function* () {
      const error = yield* setup([])
        .run((pow) => pow.toggleLike('u1', 'nope'))
        .pipe(Effect.flip);
      assert.strictEqual(error._tag, 'LikeTargetMissing');
    }),
  );
});
