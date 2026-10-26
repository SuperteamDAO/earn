import { assert, describe, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import * as AppConfig from '@/server/app-config';
import * as Database from '@/server/database';
import * as LocalProfiles from '@/server/local-profiles';
import * as SponsorDashboard from '@/server/sponsor-dashboard';
import * as SponsorMemberDetails from '@/server/sponsor-member-details';
import * as SponsorSwitch from '@/server/sponsor-switch';
import { testConfig } from '@/server/test-config';

// Bo is on Acme's team; Gil is in God mode. Kim is a core member of the
// India chapter, Lee a plain member of it.
const ROLES: Record<string, string> = {
  bo: 'USER',
  gil: 'GOD',
  kim: 'USER',
  lee: 'USER',
};
const SPONSORS = ['acme', 'globex'];

const INDIA = { id: 'in', region: 'India', countries: ['India'] };

const world = () => {
  const current = new Map<string, Record<string, unknown>>();
  const updates: Array<Record<string, unknown>> = [];
  const client = {
    user: {
      findUnique: async ({
        where,
        select,
      }: {
        where: { id: string };
        select: Record<string, unknown>;
      }) => {
        const role = ROLES[where.id];
        if (!role) return null;
        if ('people' in select) {
          return {
            role,
            people:
              where.id === 'kim'
                ? { chapterId: 'in', type: 'Core' }
                : where.id === 'lee'
                  ? { chapterId: 'in', type: 'Member' }
                  : null,
            currentSponsor:
              where.id === 'bo' ? { chapter: null } : { chapter: INDIA },
          };
        }
        if ('photo' in select) return { photo: 'https://old.example/p.png' };
        return { role };
      },
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: Record<string, unknown>;
      }) => {
        current.set(where.id, { ...current.get(where.id), ...data });
        updates.push(data);
        return {};
      },
      findMany: async () => [],
    },
    userSponsors: {
      findFirst: async ({
        where,
      }: {
        where: { userId: string; sponsorId: string };
      }) =>
        where.userId === 'bo' && where.sponsorId === 'acme'
          ? { sponsorId: 'acme' }
          : null,
      findMany: async () => [
        {
          role: 'ADMIN',
          sponsor: {
            id: 'acme',
            name: 'Acme',
            slug: 'acme',
            logo: null,
            isVerified: true,
          },
        },
      ],
    },
    sponsors: {
      findUnique: async ({ where }: { where: { id: string } }) =>
        SPONSORS.includes(where.id) ? { id: where.id } : null,
      findMany: async () =>
        SPONSORS.map((id) => ({
          id,
          name: id,
          slug: id,
          logo: null,
          isVerified: false,
        })),
    },
    hackathon: {
      findUnique: async ({ where }: { where: { id: string } }) =>
        where.id === 'redacted' ? { id: 'redacted' } : null,
      findMany: async () => [],
    },
    $queryRaw: async () => [
      {
        id: 'u1',
        firstName: 'Asha',
        lastName: 'K',
        email: 'asha@x.in',
        username: 'asha',
        skills: '[{"skills":"Design","subskills":["UI"]}]',
        totalEarnings: '1500.5',
        totalSubmissions: 3n,
        wins: 1n,
        rank: 1n,
        createdAt: new Date('2025-01-01T00:00:00Z'),
      },
    ],
  };
  const layer = Layer.mergeAll(
    SponsorSwitch.layer,
    LocalProfiles.layer,
    SponsorMemberDetails.layer,
  ).pipe(
    Layer.provide(
      Layer.succeed(
        Database.Database,
        Database.Database.of({
          query: (_operation, run) =>
            Effect.promise(() => run(client as never)),
        }),
      ),
    ),
    Layer.provide(Layer.succeed(AppConfig.AppConfig, testConfig)),
  );
  return { current, updates, layer };
};

describe('SponsorSwitch', () => {
  it.effect('switches members to their own sponsors, God mode to any', () => {
    const { current, layer } = world();
    return Effect.gen(function* () {
      const service = yield* SponsorSwitch.SponsorSwitch;
      yield* service.switchSponsor('bo', 'acme');
      assert.strictEqual(current.get('bo')?.currentSponsorId, 'acme');
      const notTheirs = yield* Effect.flip(
        service.switchSponsor('bo', 'globex'),
      );
      assert.strictEqual(notTheirs._tag, 'SwitchRefused');

      yield* service.switchSponsor('gil', 'globex');
      assert.strictEqual(current.get('gil')?.currentSponsorId, 'globex');
      const missing = yield* Effect.flip(
        service.switchSponsor('gil', 'nowhere'),
      );
      assert.strictEqual(missing._tag, 'SwitchRefused');
    }).pipe(Effect.provide(layer));
  });

  it.effect('offers God mode every sponsor, members their own', () => {
    const { layer } = world();
    return Effect.gen(function* () {
      const service = yield* SponsorSwitch.SponsorSwitch;
      const god = yield* service.sponsors('gil', '');
      assert.deepStrictEqual(
        god.map((option) => [option.value, option.sponsor.role]),
        [
          ['acme', 'GOD MODE'],
          ['globex', 'GOD MODE'],
        ],
      );
      const own = yield* service.sponsors('bo', '');
      assert.deepStrictEqual(
        own.map((option) => [option.value, option.sponsor.role]),
        [['acme', 'ADMIN']],
      );
    }).pipe(Effect.provide(layer));
  });

  it.effect('lets only God mode switch hackathons', () => {
    const { current, layer } = world();
    return Effect.gen(function* () {
      const service = yield* SponsorSwitch.SponsorSwitch;
      const member = yield* Effect.flip(
        service.switchHackathon('bo', 'redacted'),
      );
      assert.strictEqual(member._tag, 'SwitchRefused');
      yield* service.switchHackathon('gil', 'redacted');
      assert.strictEqual(current.get('gil')?.hackathonId, 'redacted');
    }).pipe(Effect.provide(layer));
  });
});

describe('LocalProfiles', () => {
  it.effect('shows a chapter’s talent to God mode and its core only', () => {
    const { layer } = world();
    return Effect.gen(function* () {
      const service = yield* LocalProfiles.LocalProfiles;
      const [profile] = yield* service.list('kim');
      assert.strictEqual(profile?.totalEarnings, 1500.5);
      assert.strictEqual(profile?.totalSubmissions, 3);
      assert.deepStrictEqual(profile?.skills, [
        { skills: 'Design', subskills: ['UI'] },
      ]);
      assert.strictEqual(profile?.createdAt, '2025-01-01T00:00:00.000Z');
      assert.lengthOf(yield* service.list('gil'), 1);

      const member = yield* Effect.flip(service.list('lee'));
      assert.strictEqual(member._tag, 'NotChapterCore');
      const noChapter = yield* Effect.flip(service.list('bo'));
      assert.strictEqual(noChapter._tag, 'NoChapter');
    }).pipe(Effect.provide(layer));
  });

  it('reads a chapter’s countries, or its region without any', () => {
    assert.deepStrictEqual(
      LocalProfiles.countriesOf({ region: 'UAE', countries: [] }),
      ['UAE'],
    );
    assert.deepStrictEqual(
      LocalProfiles.countriesOf({
        region: 'Balkans',
        countries: ['Serbia', 'Croatia'],
      }),
      ['Serbia', 'Croatia'],
    );
  });
});

describe('SponsorMemberDetails', () => {
  const details = {
    firstName: 'Bo',
    lastName: 'B',
    username: 'bo',
    telegram: 'https://t.me/bo_acme',
  };

  it.effect('saves the Telegram username as a t.me link', () => {
    const { updates, layer } = world();
    return Effect.gen(function* () {
      const service = yield* SponsorMemberDetails.SponsorMemberDetails;
      yield* service.complete('bo', details);
      assert.strictEqual(updates[0]?.telegram, 'https://t.me/bo_acme');
      for (const telegram of ['https://t.me/1bo', 'https://t.me/ab', 'bo']) {
        const refused = yield* Effect.flip(
          service.complete('bo', { ...details, telegram }),
        );
        assert.strictEqual(refused._tag, 'InvalidDetails');
      }
    }).pipe(Effect.provide(layer));
  });

  it.effect('refuses photos that aren’t Earn’s uploads', () => {
    const { updates, layer } = world();
    return Effect.gen(function* () {
      const service = yield* SponsorMemberDetails.SponsorMemberDetails;
      const refused = yield* Effect.flip(
        service.complete('bo', {
          ...details,
          photo: 'https://evil.example/x.png',
        }),
      );
      assert.strictEqual(refused._tag, 'InvalidPhoto');
      // Google's avatars are taken as they are.
      yield* service.complete('bo', {
        ...details,
        photo: 'https://lh3.googleusercontent.com/a/x',
      });
      assert.strictEqual(
        updates[0]?.photo,
        'https://lh3.googleusercontent.com/a/x',
      );
      // Cloudinary can't be asked here: the photo they had stays.
      yield* service.complete('bo', {
        ...details,
        photo: 'https://res.cloudinary.com/earn/image/upload/v1/u/p.png',
      });
      assert.strictEqual(updates[1]?.photo, 'https://old.example/p.png');
    }).pipe(Effect.provide(layer));
  });

  it('reads Cloudinary public ids as Earn does', () => {
    assert.strictEqual(
      SponsorMemberDetails.cloudinaryPublicId(
        'https://res.cloudinary.com/earn/image/upload/v123/users/a.b.png',
      ),
      'users/a.b',
    );
    assert.isNull(
      SponsorMemberDetails.cloudinaryPublicId('https://example.com/a.png'),
    );
  });
});

describe('SponsorDashboard rows', () => {
  it('normalizes MySQL’s raw values', () => {
    const row = SponsorDashboard.toDashboardListing({
      type: 'bounty',
      id: 'l1',
      title: 'Design a logo',
      slug: 'logo',
      token: 'USDC',
      status: 'OPEN',
      deadline: new Date('2026-11-01T00:00:00Z'),
      isPublished: 1,
      rewards: '{"1":500,"2":250}',
      rewardAmount: 750,
      totalPaymentsMade: 2n,
      isWinnersAnnounced: '0',
      isFndnPaying: null,
      compensationType: 'fixed',
      submissionCount: 7n,
    });
    assert.strictEqual(row.isPublished, true);
    assert.strictEqual(row.isWinnersAnnounced, false);
    assert.strictEqual(row.isFndnPaying, false);
    assert.strictEqual(row.totalPaymentsMade, 2);
    assert.strictEqual(row.submissionCount, 7);
    assert.deepStrictEqual(row.rewards, { 1: 500, 2: 250 });
    assert.strictEqual(row.deadline, '2026-11-01T00:00:00.000Z');
  });
});
