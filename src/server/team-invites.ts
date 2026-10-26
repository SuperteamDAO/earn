import 'server-only';

import * as Clock from 'effect/Clock';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Schema from 'effect/Schema';
import { randomBytes } from 'node:crypto';

import * as AppConfig from '@/server/app-config';
import * as Database from '@/server/database';
import * as TeamInviteMail from '@/server/team-invite-mail';
import type * as Users from '@/server/users';

import type { Role } from './team-members';

// Earn's invites last a week.
const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
// A second accept of the same link soon after the first (a double click, a
// retry) is the same success.
const DUPLICATE_ACCEPT_GRACE_MS = 90 * 1000;

// The categories every sponsor member is subscribed to on joining.
const SPONSOR_EMAIL_SETTINGS = [
  'commentSponsor',
  'deadlineSponsor',
  'productAndNewsletter',
  'replyOrTagComment',
];

export interface InviteDetails {
  readonly sponsorName: string;
  readonly senderName: string;
  readonly memberType: Role;
  readonly sponsorLogo: string | null;
  readonly invitedEmail: string;
}

export class NotAdmin extends Schema.TaggedError<NotAdmin>()(
  'InviteNotAdmin',
  {},
) {
  override get message() {
    return 'Unauthorized';
  }
}

export class BlockedEmail extends Schema.TaggedError<BlockedEmail>()(
  'BlockedEmail',
  {},
) {
  override get message() {
    return 'Blocked Email';
  }
}

// Accepting didn't work; the message is Earn's, shown to them.
export class InviteRefused extends Schema.TaggedError<InviteRefused>()(
  'InviteRefused',
  { reason: Schema.String },
) {
  override get message() {
    return this.reason;
  }
}

const refuse = (reason: string) => Effect.fail(new InviteRefused({ reason }));

export class TeamInvites extends Context.Service<
  TeamInvites,
  {
    // Invites an email to the actor's current sponsor and emails the link.
    readonly send: (
      actor: Users.SponsorWriter,
      invite: { readonly email: string; readonly memberType: Role },
    ) => Effect.Effect<
      void,
      | NotAdmin
      | BlockedEmail
      | TeamInviteMail.InviteMailFailed
      | Database.DatabaseError
    >;
    // What the invite page shows; null when invalid or expired.
    readonly details: (
      token: string,
    ) => Effect.Effect<InviteDetails | null, Database.DatabaseError>;
    // Joins them to the sponsor, as Earn's handleInviteAcceptance did.
    readonly accept: (
      userId: string,
      token: string,
    ) => Effect.Effect<
      { readonly message: string },
      InviteRefused | Database.DatabaseError
    >;
  }
>()('earn/TeamInvites') {}

const make = Effect.gen(function* () {
  const database = yield* Database.Database;
  const config = yield* AppConfig.AppConfig;
  const mail = yield* TeamInviteMail.TeamInviteMail;

  const send = Effect.fn('TeamInvites.send')(function* (
    actor: Users.SponsorWriter,
    invite: { readonly email: string; readonly memberType: Role },
  ) {
    const email = invite.email.toLowerCase();
    const user = yield* database.query('inviteSender', (client) =>
      client.user.findUnique({
        where: { id: actor.userId },
        select: {
          firstName: true,
          lastName: true,
          role: true,
          currentSponsor: { select: { id: true, name: true } },
          UserSponsors: { select: { sponsorId: true, role: true } },
        },
      }),
    );
    const sponsor = user?.currentSponsor;
    if (!user || !sponsor) return yield* new NotAdmin();
    const own = user.UserSponsors.find((row) => row.sponsorId === sponsor.id);
    if (user.role !== 'GOD' && own?.role !== 'ADMIN') {
      return yield* new NotAdmin();
    }
    const blocked = yield* database.query('blockedEmail', (client) =>
      client.blockedEmail.findUnique({ where: { email } }),
    );
    if (blocked) return yield* new BlockedEmail();

    const now = yield* Clock.currentTimeMillis;
    const token = randomBytes(32).toString('hex');
    yield* database.query('createInvite', (client) =>
      client.userInvites.create({
        data: {
          email,
          senderId: actor.userId,
          sponsorId: sponsor.id,
          memberType: invite.memberType,
          token,
          expires: new Date(now + INVITE_TTL_MS),
        },
      }),
    );
    const link = new URL('/earn/signup/', config.siteUrl);
    link.searchParams.set('invite', token);
    return yield* mail.send({
      to: email,
      senderFirstName: user.firstName,
      senderName: `${user.firstName} ${user.lastName}`,
      sponsorName: sponsor.name,
      link: link.toString(),
    });
  });

  const details = Effect.fn('TeamInvites.details')(function* (token: string) {
    const invite = yield* database.query('inviteByToken', (client) =>
      client.userInvites.findUnique({
        where: { token },
        select: {
          email: true,
          memberType: true,
          expires: true,
          sender: { select: { firstName: true, lastName: true } },
          sponsor: { select: { name: true, logo: true } },
        },
      }),
    );
    const now = yield* Clock.currentTimeMillis;
    if (!invite || invite.expires.getTime() < now) return null;
    return {
      sponsorName: invite.sponsor.name,
      senderName: `${invite.sender.firstName} ${invite.sender.lastName}`,
      memberType: invite.memberType,
      sponsorLogo: invite.sponsor.logo,
      invitedEmail: invite.email,
    } satisfies InviteDetails;
  });

  const accept = Effect.fn('TeamInvites.accept')(function* (
    userId: string,
    token: string,
  ) {
    const user = yield* database.query('inviteeAccount', (client) =>
      client.user.findUnique({
        where: { id: userId },
        select: { email: true, currentSponsorId: true },
      }),
    );
    if (!user) return yield* refuse('User not found');
    const invite = yield* database.query('inviteByToken', (client) =>
      client.userInvites.findUnique({ where: { token } }),
    );
    const now = yield* Clock.currentTimeMillis;
    if (!invite || invite.expires.getTime() < now) {
      // Already used by them a moment ago: the same success.
      const recent = yield* database.query('recentMembership', (client) =>
        client.userSponsors.findFirst({
          where: {
            userId,
            createdAt: { gte: new Date(now - DUPLICATE_ACCEPT_GRACE_MS) },
          },
          orderBy: { createdAt: 'desc' },
          select: { sponsorId: true },
        }),
      );
      if (recent && user.currentSponsorId === recent.sponsorId) {
        return { message: 'Invitation already accepted' };
      }
      return yield* refuse('No valid invitation found');
    }
    if (user.email.toLowerCase() !== invite.email.toLowerCase()) {
      return yield* refuse(
        'This invitation was sent to a different email address. Please sign in with the correct email to accept this invitation.',
      );
    }
    const existing = yield* database.query('existingMembership', (client) =>
      client.userSponsors.findUnique({
        where: {
          userId_sponsorId: { userId, sponsorId: invite.sponsorId },
        },
        select: { role: true },
      }),
    );
    if (existing) return { message: 'Invitation already accepted' };

    yield* database.query('acceptInvite', (client) =>
      client.$transaction(async (tx) => {
        await tx.userSponsors.create({
          data: {
            userId,
            sponsorId: invite.sponsorId,
            role: invite.memberType,
          },
        });
        await tx.user.update({
          where: { id: userId },
          data: { currentSponsorId: invite.sponsorId },
        });
        await tx.userInvites.delete({ where: { id: invite.id } });
      }),
    );
    // Earn's createSponsorEmailSettings: each category once.
    yield* database.query('sponsorEmailSettings', async (client) => {
      for (const category of SPONSOR_EMAIL_SETTINGS) {
        await client.emailSettings.deleteMany({ where: { userId, category } });
        await client.emailSettings.create({
          data: { user: { connect: { id: userId } }, category },
        });
      }
    });
    return { message: 'Invitation accepted successfully' };
  });

  return TeamInvites.of({ send, details, accept });
});

export const layer = Layer.effect(TeamInvites, make);
