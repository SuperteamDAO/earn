import 'server-only';

import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Schema from 'effect/Schema';

import * as Database from '@/server/database';
import type * as Users from '@/server/users';

export type Role = 'ADMIN' | 'MEMBER';

export interface Member {
  readonly userId: string;
  readonly sponsorId: string;
  readonly role: Role;
  readonly user: {
    readonly id: string;
    readonly email: string;
    readonly username: string | null;
    readonly firstName: string | null;
    readonly lastName: string | null;
    readonly photo: string | null;
  };
}

export const MEMBERS_PER_PAGE = 15;

// Only the sponsor's admins (and God mode) manage its team.
export class NotAdmin extends Schema.TaggedError<NotAdmin>()('NotAdmin', {}) {
  override get message() {
    return 'Forbidden';
  }
}

export class MemberNotFound extends Schema.TaggedError<MemberNotFound>()(
  'MemberNotFound',
  {},
) {
  override get message() {
    return 'Member not found';
  }
}

export class OwnRole extends Schema.TaggedError<OwnRole>()('OwnRole', {}) {
  override get message() {
    return 'You cannot change your own role';
  }
}

export class TeamMembers extends Context.Service<
  TeamMembers,
  {
    // A page of the sponsor's team, searched by email, username or name.
    readonly list: (
      sponsorId: string,
      page: { readonly search: string; readonly skip: number },
    ) => Effect.Effect<
      { readonly total: number; readonly data: ReadonlyArray<Member> },
      Database.DatabaseError
    >;
    readonly remove: (
      actor: Users.SponsorWriter,
      memberId: string,
    ) => Effect.Effect<
      void,
      NotAdmin | MemberNotFound | Database.DatabaseError
    >;
    // `changed` is false when they already had the role.
    readonly updateRole: (
      actor: Users.SponsorWriter,
      memberId: string,
      role: Role,
    ) => Effect.Effect<
      { readonly changed: boolean },
      NotAdmin | MemberNotFound | OwnRole | Database.DatabaseError
    >;
    // Whether they're on any sponsor's team (Earn's /api/user-sponsors).
    readonly hasMembership: (
      userId: string,
    ) => Effect.Effect<boolean, Database.DatabaseError>;
  }
>()('earn/TeamMembers') {}

const make = Effect.gen(function* () {
  const database = yield* Database.Database;

  const membership = (userId: string, sponsorId: string) =>
    database.query('teamMembership', (client) =>
      client.userSponsors.findUnique({
        where: { userId_sponsorId: { userId, sponsorId } },
        select: { role: true },
      }),
    );

  const requireAdmin = Effect.fn('TeamMembers.requireAdmin')(function* (
    actor: Users.SponsorWriter,
  ) {
    if (actor.god) return true;
    const own = yield* membership(actor.userId, actor.sponsorId);
    if (own?.role !== 'ADMIN') return yield* new NotAdmin();
    return true;
  });

  const list = Effect.fn('TeamMembers.list')(function* (
    sponsorId: string,
    page: { readonly search: string; readonly skip: number },
  ) {
    const where = {
      sponsorId,
      ...(page.search
        ? {
            OR: (['email', 'username', 'firstName', 'lastName'] as const).map(
              (field) => ({ user: { [field]: { contains: page.search } } }),
            ),
          }
        : {}),
    };
    const [total, data] = yield* database.query('teamMembers', (client) =>
      Promise.all([
        client.userSponsors.count({ where }),
        client.userSponsors.findMany({
          where,
          skip: page.skip,
          take: MEMBERS_PER_PAGE,
          select: {
            userId: true,
            sponsorId: true,
            role: true,
            user: {
              select: {
                id: true,
                email: true,
                username: true,
                firstName: true,
                lastName: true,
                photo: true,
              },
            },
          },
        }),
      ]),
    );
    return { total, data };
  });

  // Earn's members/remove: their membership goes, and so does the sponsor
  // as their current one.
  const remove = Effect.fn('TeamMembers.remove')(function* (
    actor: Users.SponsorWriter,
    memberId: string,
  ) {
    yield* requireAdmin(actor);
    if (!(yield* membership(memberId, actor.sponsorId))) {
      return yield* new MemberNotFound();
    }
    return yield* database
      .query('removeMember', async (client) => {
        await client.userSponsors.delete({
          where: {
            userId_sponsorId: { userId: memberId, sponsorId: actor.sponsorId },
          },
        });
        await client.user.updateMany({
          where: { id: memberId, currentSponsorId: actor.sponsorId },
          data: { currentSponsorId: null },
        });
      })
      .pipe(Effect.asVoid);
  });

  const updateRole = Effect.fn('TeamMembers.updateRole')(function* (
    actor: Users.SponsorWriter,
    memberId: string,
    role: Role,
  ) {
    if (memberId === actor.userId) return yield* new OwnRole();
    yield* requireAdmin(actor);
    const member = yield* membership(memberId, actor.sponsorId);
    if (!member) return yield* new MemberNotFound();
    if (member.role === role) return { changed: false };
    yield* database.query('updateMemberRole', (client) =>
      client.userSponsors.update({
        where: {
          userId_sponsorId: { userId: memberId, sponsorId: actor.sponsorId },
        },
        data: { role },
      }),
    );
    return { changed: true };
  });

  const hasMembership = Effect.fn('TeamMembers.hasMembership')(function* (
    userId: string,
  ) {
    const row = yield* database.query('anyMembership', (client) =>
      client.userSponsors.findFirst({
        where: { userId },
        select: { userId: true },
      }),
    );
    return row !== null;
  });

  return TeamMembers.of({ list, remove, updateRole, hasMembership });
});

export const layer = Layer.effect(TeamMembers, make);
