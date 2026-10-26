import { assert, describe, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { TestClock } from 'effect/testing';

import * as Database from '@/server/database';
import * as SponsorStages from '@/server/sponsor-stage';

const NOW = new Date('2026-10-26T12:00:00Z');
const DAY = 24 * 60 * 60 * 1000;
const ago = (days: number) => new Date(NOW.getTime() - days * DAY);

const listing = (
  overrides: Partial<SponsorStages.StageListing> = {},
): SponsorStages.StageListing => ({
  id: 'l1',
  title: 'Design a logo',
  slug: 'design-a-logo',
  type: 'bounty',
  deadline: new Date(NOW.getTime() + 5 * DAY),
  commitmentDate: new Date(NOW.getTime() + 10 * DAY),
  isPublished: true,
  isActive: true,
  isArchived: false,
  isWinnersAnnounced: false,
  winnersAnnouncedAt: null,
  usdValue: 500,
  publishedAt: ago(10),
  status: 'OPEN',
  updatedAt: ago(1),
  region: 'Global',
  sponsorId: 's1',
  token: 'USDC',
  rewardAmount: 500,
  compensationType: 'fixed',
  minRewardAsk: null,
  maxRewardAsk: null,
  rewards: { '1': 300, '2': 200 },
  maxBonusSpots: 0,
  isFndnPaying: false,
  sponsor: { name: 'Acme', slug: 'acme', logo: null },
  ...overrides,
});

const none = new Set<string>();

describe('decideStage', () => {
  it('calls a sponsor with no live listings new', () => {
    assert.deepStrictEqual(SponsorStages.decideStage([], none, NOW), {
      stage: SponsorStages.SponsorStage.NEW_SPONSOR,
      listing: null,
    });
  });

  it('asks to post the next listing when nothing needs doing', () => {
    const decided = SponsorStages.decideStage([listing()], none, NOW);
    assert.strictEqual(decided.stage, SponsorStages.SponsorStage.NEXT_LISTING);
    assert.isNull(decided.listing);
  });

  it('asks for winners once the deadline has passed', () => {
    const decided = SponsorStages.decideStage(
      [listing({ deadline: ago(2) })],
      none,
      NOW,
    );
    assert.strictEqual(decided.stage, SponsorStages.SponsorStage.REVIEW);
  });

  it('puts an overdue winner announcement first', () => {
    const decided = SponsorStages.decideStage(
      [
        listing({
          id: 'pay',
          isWinnersAnnounced: true,
          winnersAnnouncedAt: ago(1),
        }),
        listing({ id: 'late', deadline: ago(9), commitmentDate: ago(3) }),
      ],
      new Set(['pay']),
      NOW,
    );
    assert.strictEqual(decided.stage, SponsorStages.SponsorStage.REVIEW_URGENT);
    assert.strictEqual(decided.listing?.id, 'late');
  });

  it('asks for payment, unless the foundation pays', () => {
    const announced = listing({
      isWinnersAnnounced: true,
      winnersAnnouncedAt: ago(1),
    });
    assert.strictEqual(
      SponsorStages.decideStage([announced], new Set(['l1']), NOW).stage,
      SponsorStages.SponsorStage.PAYMENT_PENDING,
    );
    assert.strictEqual(
      SponsorStages.decideStage(
        [{ ...announced, isFndnPaying: true }],
        new Set(['l1']),
        NOW,
      ).stage,
      SponsorStages.SponsorStage.NEXT_LISTING,
    );
  });

  it('lets a week-old payment reminder fall behind a review', () => {
    const decided = SponsorStages.decideStage(
      [
        listing({
          id: 'pay',
          isWinnersAnnounced: true,
          winnersAnnouncedAt: ago(9),
        }),
        listing({ id: 'review', deadline: ago(1) }),
      ],
      new Set(['pay']),
      NOW,
    );
    assert.strictEqual(decided.listing?.id, 'review');
  });

  it('shows a listing under verification', () => {
    const decided = SponsorStages.decideStage(
      [listing({ status: 'VERIFYING', isPublished: false })],
      none,
      NOW,
    );
    assert.strictEqual(
      decided.stage,
      SponsorStages.SponsorStage.UNDER_VERIFICATION,
    );
  });
});

const layerWith = (rows: SponsorStages.StageListing[]) =>
  SponsorStages.layer.pipe(
    Layer.provide(
      Layer.succeed(
        Database.Database,
        Database.Database.of({
          query: (_operation, run) =>
            Effect.promise(() =>
              run({
                bounties: { findMany: async () => rows },
                submission: {
                  groupBy: async () => [{ listingId: 'l1', _count: { id: 1 } }],
                  count: async () => 4,
                },
              } as never),
            ),
        }),
      ),
    ),
  );

describe('SponsorStages.stage', () => {
  it.effect(
    'sends the stage, its listing as Earn did and its submissions',
    () =>
      Effect.gen(function* () {
        yield* TestClock.setTime(NOW.getTime());
        const stages = yield* SponsorStages.SponsorStages;
        const data = yield* stages.stage('s1');
        assert.strictEqual(data.stage, SponsorStages.SponsorStage.REVIEW);
        assert.strictEqual(data.listing?.deadline, ago(1).toISOString());
        assert.deepStrictEqual(data.listing?.rewards, { '1': 300, '2': 200 });
        assert.strictEqual(data.submissionCount, 4);
      }).pipe(Effect.provide(layerWith([listing({ deadline: ago(1) })]))),
  );

  it.effect('has nothing to count for a new sponsor', () =>
    Effect.gen(function* () {
      const stages = yield* SponsorStages.SponsorStages;
      const data = yield* stages.stage('s1');
      assert.strictEqual(data.stage, SponsorStages.SponsorStage.NEW_SPONSOR);
      assert.isNull(data.submissionCount);
    }).pipe(Effect.provide(layerWith([]))),
  );
});
