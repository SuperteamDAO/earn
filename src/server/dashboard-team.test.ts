import { assert, describe, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';
import * as Layer from 'effect/Layer';
import { TestClock } from 'effect/testing';

import * as AppConfig from '@/server/app-config';
import * as Database from '@/server/database';
import * as TeamInviteMail from '@/server/team-invite-mail';
import * as TeamInvites from '@/server/team-invites';
import * as TeamMembers from '@/server/team-members';
import { testConfig } from '@/server/test-config';
import type * as Users from '@/server/users';

const NOW = Date.parse('2026-10-26T12:00:00Z');
const DAY = 86_400_000;

type Role = 'ADMIN' | 'MEMBER';

interface Invite {
  id: string;
  email: string;
  senderId: string;
  sponsorId: string;
  memberType: Role;
  token: string;
  expires: Date;
}

// Acme's team: Ada its admin, Bo a member; Cy on no team; Gil in God mode.
const USERS: Record<
  string,
  {
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    currentSponsorId: string | null;
  }
> = {
  ada: {
    email: 'ada@acme.xyz',
    firstName: 'Ada',
    lastName: 'L',
    role: 'USER',
    currentSponsorId: 'acme',
  },
  bo: {
    email: 'bo@acme.xyz',
    firstName: 'Bo',
    lastName: 'B',
    role: 'USER',
    currentSponsorId: 'acme',
  },
  cy: {
    email: 'Cy@Example.com',
    firstName: 'Cy',
    lastName: 'C',
    role: 'USER',
    currentSponsorId: null,
  },
  gil: {
    email: 'gil@superteam.fun',
    firstName: 'Gil',
    lastName: 'G',
    role: 'GOD',
    currentSponsorId: 'acme',
  },
};

const actor = (userId: string): Users.SponsorWriter => ({
  userId,
  privyDid: `did:privy:${userId}`,
  sponsorId: 'acme',
  role: USERS[userId]?.role ?? 'USER',
  god: USERS[userId]?.role === 'GOD',
  hackathonId: null,
});

const key = (where: { userId_sponsorId: { userId: string } }) =>
  where.userId_sponsorId.userId;

const world = () => {
  const users = structuredClone(USERS);
  const team = new Map<string, { role: Role; createdAt: Date }>([
    ['ada', { role: 'ADMIN', createdAt: new Date(NOW - DAY) }],
    ['bo', { role: 'MEMBER', createdAt: new Date(NOW - DAY) }],
  ]);
  const invites: Array<Invite> = [];
  const blocked = new Set<string>(['spam@bad.xyz']);
  const settings: Array<{ userId: string; category: string }> = [];
  const mails: Array<TeamInviteMail.InviteMail> = [];

  const client = {
    $transaction: async (run: (tx: unknown) => Promise<unknown>) => run(client),
    user: {
      findUnique: async ({ where }: { where: { id: string } }) => {
        const user = users[where.id];
        if (!user) return null;
        return {
          ...user,
          currentSponsor: user.currentSponsorId
            ? { id: 'acme', name: 'Acme' }
            : null,
          UserSponsors: team.has(where.id)
            ? [{ sponsorId: 'acme', role: team.get(where.id)?.role }]
            : [],
        };
      },
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: { currentSponsorId: string };
      }) => {
        const user = users[where.id];
        if (user) user.currentSponsorId = data.currentSponsorId;
        return {};
      },
      updateMany: async ({
        where,
      }: {
        where: { id: string; currentSponsorId: string };
      }) => {
        const user = users[where.id];
        if (user?.currentSponsorId === where.currentSponsorId) {
          user.currentSponsorId = null;
        }
        return { count: 1 };
      },
    },
    userSponsors: {
      findUnique: async ({
        where,
      }: {
        where: { userId_sponsorId: { userId: string } };
      }) => {
        const row = team.get(key(where));
        return row ? { role: row.role } : null;
      },
      findFirst: async ({
        where,
      }: {
        where: { userId: string; createdAt?: { gte: Date } };
      }) => {
        const row = team.get(where.userId);
        if (!row) return null;
        if (where.createdAt && row.createdAt < where.createdAt.gte) {
          return null;
        }
        return { sponsorId: 'acme', userId: where.userId };
      },
      create: async ({ data }: { data: { userId: string; role: Role } }) => {
        team.set(data.userId, { role: data.role, createdAt: new Date(NOW) });
        return {};
      },
      update: async ({
        where,
        data,
      }: {
        where: { userId_sponsorId: { userId: string } };
        data: { role: Role };
      }) => {
        const row = team.get(key(where));
        if (row) row.role = data.role;
        return {};
      },
      delete: async ({
        where,
      }: {
        where: { userId_sponsorId: { userId: string } };
      }) => {
        team.delete(key(where));
        return {};
      },
    },
    userInvites: {
      create: async ({ data }: { data: Omit<Invite, 'id'> }) => {
        invites.push({ id: `i${invites.length + 1}`, ...data });
        return {};
      },
      findUnique: async ({ where }: { where: { token: string } }) => {
        const invite = invites.find((item) => item.token === where.token);
        return invite
          ? {
              ...invite,
              sender: { firstName: 'Ada', lastName: 'L' },
              sponsor: { name: 'Acme', logo: null },
            }
          : null;
      },
      delete: async ({ where }: { where: { id: string } }) => {
        invites.splice(
          invites.findIndex((item) => item.id === where.id),
          1,
        );
        return {};
      },
    },
    blockedEmail: {
      findUnique: async ({ where }: { where: { email: string } }) =>
        blocked.has(where.email) ? { email: where.email } : null,
    },
    emailSettings: {
      deleteMany: async () => ({}),
      create: async ({
        data,
      }: {
        data: { user: { connect: { id: string } }; category: string };
      }) => {
        settings.push({
          userId: data.user.connect.id,
          category: data.category,
        });
        return {};
      },
    },
  };

  const database = Layer.succeed(
    Database.Database,
    Database.Database.of({
      query: (_operation, run) => Effect.promise(() => run(client as never)),
    }),
  );
  const mail = Layer.succeed(
    TeamInviteMail.TeamInviteMail,
    TeamInviteMail.TeamInviteMail.of({
      send: (message) =>
        Effect.sync(() => {
          mails.push(message);
        }),
    }),
  );
  const layer = Layer.mergeAll(
    TeamMembers.layer,
    TeamInvites.layer.pipe(Layer.provide(mail)),
  ).pipe(
    Layer.provide(database),
    Layer.provide(Layer.succeed(AppConfig.AppConfig, testConfig)),
  );
  return { users, team, invites, settings, mails, layer };
};

const atNow = TestClock.setTime(NOW);

describe('TeamMembers', () => {
  it.effect('lets only admins and God mode remove or re-role members', () => {
    const { users, team, layer } = world();
    return Effect.gen(function* () {
      const members = yield* TeamMembers.TeamMembers;
      const byMember = yield* Effect.exit(members.remove(actor('bo'), 'ada'));
      assert.isTrue(Exit.isFailure(byMember));
      const promote = yield* Effect.exit(
        members.updateRole(actor('bo'), 'ada', 'MEMBER'),
      );
      assert.isTrue(Exit.isFailure(promote));

      assert.deepStrictEqual(
        yield* members.updateRole(actor('gil'), 'bo', 'ADMIN'),
        { changed: true },
      );
      assert.deepStrictEqual(
        yield* members.updateRole(actor('ada'), 'bo', 'ADMIN'),
        { changed: false },
      );
      yield* members.remove(actor('ada'), 'bo');
      assert.isFalse(team.has('bo'));
      // Their current sponsor goes with the membership.
      assert.isNull(users.bo?.currentSponsorId ?? null);
    }).pipe(Effect.provide(layer));
  });

  it.effect('refuses changing one’s own role and unknown members', () => {
    const { layer } = world();
    return Effect.gen(function* () {
      const members = yield* TeamMembers.TeamMembers;
      const own = yield* Effect.flip(
        members.updateRole(actor('ada'), 'ada', 'MEMBER'),
      );
      assert.strictEqual(own._tag, 'OwnRole');
      const missing = yield* Effect.flip(members.remove(actor('ada'), 'cy'));
      assert.strictEqual(missing._tag, 'MemberNotFound');
    }).pipe(Effect.provide(layer));
  });
});

describe('TeamInvites', () => {
  it.effect(
    'sends a week-long invite from admins, never to blocked emails',
    () => {
      const { invites, mails, layer } = world();
      return Effect.gen(function* () {
        yield* atNow;
        const service = yield* TeamInvites.TeamInvites;
        const fromMember = yield* Effect.flip(
          service.send(actor('bo'), { email: 'x@y.z', memberType: 'MEMBER' }),
        );
        assert.strictEqual(fromMember._tag, 'InviteNotAdmin');
        const toBlocked = yield* Effect.flip(
          service.send(actor('ada'), {
            email: 'SPAM@bad.xyz',
            memberType: 'MEMBER',
          }),
        );
        assert.strictEqual(toBlocked._tag, 'BlockedEmail');

        yield* service.send(actor('ada'), {
          email: 'New@Acme.xyz',
          memberType: 'ADMIN',
        });
        const invite = invites[0];
        assert.strictEqual(invite?.email, 'new@acme.xyz');
        assert.strictEqual(invite?.memberType, 'ADMIN');
        assert.strictEqual(invite?.expires.getTime(), NOW + 7 * DAY);
        assert.strictEqual(mails[0]?.to, 'new@acme.xyz');
        assert.strictEqual(mails[0]?.senderName, 'Ada L');
        assert.strictEqual(
          mails[0]?.link,
          `http://localhost:3000/earn/signup/?invite=${invite?.token}`,
        );
      }).pipe(Effect.provide(layer));
    },
  );

  it.effect('joins only the invited email, once, and subscribes them', () => {
    const { users, team, invites, settings, layer } = world();
    return Effect.gen(function* () {
      yield* atNow;
      const service = yield* TeamInvites.TeamInvites;
      invites.push({
        id: 'i1',
        email: 'cy@example.com',
        senderId: 'ada',
        sponsorId: 'acme',
        memberType: 'MEMBER',
        token: 'tok',
        expires: new Date(NOW + DAY),
      });
      assert.deepStrictEqual(yield* service.details('tok'), {
        sponsorName: 'Acme',
        senderName: 'Ada L',
        memberType: 'MEMBER',
        sponsorLogo: null,
        invitedEmail: 'cy@example.com',
      });

      const wrong = yield* Effect.flip(service.accept('bo', 'tok'));
      assert.include(wrong.message, 'different email address');

      assert.deepStrictEqual(yield* service.accept('cy', 'tok'), {
        message: 'Invitation accepted successfully',
      });
      assert.strictEqual(team.get('cy')?.role, 'MEMBER');
      assert.strictEqual(users.cy?.currentSponsorId, 'acme');
      assert.lengthOf(invites, 0);
      assert.sameMembers(
        settings.map((row) => row.category),
        [
          'commentSponsor',
          'deadlineSponsor',
          'productAndNewsletter',
          'replyOrTagComment',
        ],
      );
      // A double click: the used link is the same success.
      assert.deepStrictEqual(yield* service.accept('cy', 'tok'), {
        message: 'Invitation already accepted',
      });
    }).pipe(Effect.provide(layer));
  });

  it.effect('treats expired and unknown invites as invalid', () => {
    const { invites, layer } = world();
    return Effect.gen(function* () {
      yield* atNow;
      const service = yield* TeamInvites.TeamInvites;
      invites.push({
        id: 'i1',
        email: 'ada@acme.xyz',
        senderId: 'ada',
        sponsorId: 'acme',
        memberType: 'MEMBER',
        token: 'old',
        expires: new Date(NOW - 1),
      });
      assert.isNull(yield* service.details('old'));
      assert.isNull(yield* service.details('missing'));
      const refused = yield* Effect.flip(service.accept('bo', 'missing'));
      assert.strictEqual(refused.message, 'No valid invitation found');
    }).pipe(Effect.provide(layer));
  });
});
