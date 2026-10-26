import 'server-only';

import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';
import * as Schema from 'effect/Schema';

import { Prisma } from '@/prisma/client';
import * as Database from '@/server/database';

// What every page knows about whoever is signed in: their Earn account as
// the header, menus and forms need it. Never their KYC (the client omits it).
export const VIEWER = {
  id: true,
  email: true,
  username: true,
  firstName: true,
  lastName: true,
  photo: true,
  isTalentFilled: true,
  location: true,
  locationUpdatedAt: true,
  currentSponsorId: true,
  walletAddress: true,
  skills: true,
  hackathonId: true,
  interests: true,
  community: true,
  private: true,
  acceptedTOS: true,
  cryptoExperience: true,
  currentEmployer: true,
  bio: true,
  discord: true,
  experience: true,
  github: true,
  linkedin: true,
  telegram: true,
  twitter: true,
  website: true,
  workPrefernce: true,
  peopleId: true,
  isBlocked: true,
  role: true,
  createdAt: true,
  linkedTwitter: true,
  emailSettings: { select: { category: true } },
  currentSponsor: {
    select: {
      id: true,
      name: true,
      logo: true,
      isVerified: true,
      entityName: true,
      slug: true,
      verificationInfo: true,
      chapter: {
        select: {
          id: true,
          region: true,
          displayValue: true,
          code: true,
          countries: true,
          icons: true,
        },
      },
    },
  },
  people: {
    select: {
      id: true,
      chapterId: true,
      type: true,
      chapter: {
        select: {
          id: true,
          name: true,
          region: true,
          displayValue: true,
          code: true,
          countries: true,
          icons: true,
          sponsorId: true,
        },
      },
    },
  },
  UserSponsors: { select: { sponsorId: true, role: true } },
  Hackathon: { select: { id: true, name: true } },
  _count: { select: { Submission: true } },
} as const satisfies Prisma.UserSelect;

export type Viewer = Prisma.UserGetPayload<{ select: typeof VIEWER }>;

// Who may write, as Earn's getUserSession decides: an Earn account that
// isn't blocked.
export interface Writer {
  readonly userId: string;
  readonly privyDid: string;
}

// Who may act for a sponsor, as Earn's getSponsorSession decides: a writer
// who has switched to one (`currentSponsorId`). `god` is Earn's GOD role.
export interface SponsorWriter extends Writer {
  readonly sponsorId: string;
  readonly role: string;
  readonly god: boolean;
  readonly hackathonId: string | null;
}

export class NoAccount extends Schema.TaggedError<NoAccount>()(
  'NoAccount',
  {},
) {
  override get message() {
    return 'No Earn account for this sign-in';
  }
}

export class Blocked extends Schema.TaggedError<Blocked>()('Blocked', {}) {
  override get message() {
    return 'Account is blocked';
  }
}

export class NoSponsor extends Schema.TaggedError<NoSponsor>()(
  'NoSponsor',
  {},
) {
  override get message() {
    return 'Account has no current sponsor';
  }
}

// Their email already has an Earn account that signs in another way.
export class EmailTaken extends Schema.TaggedError<EmailTaken>()(
  'EmailTaken',
  {},
) {
  override get message() {
    return 'Email belongs to another account';
  }
}

export class Users extends Context.Service<
  Users,
  {
    readonly viewer: (
      privyDid: string,
    ) => Effect.Effect<Option.Option<Viewer>, Database.DatabaseError>;
    readonly writer: (
      privyDid: string,
    ) => Effect.Effect<Writer, NoAccount | Blocked | Database.DatabaseError>;
    readonly sponsorWriter: (
      privyDid: string,
    ) => Effect.Effect<
      SponsorWriter,
      NoAccount | Blocked | NoSponsor | Database.DatabaseError
    >;
    // Makes the Earn account for a first sign-in, keyed by the email Privy
    // verified, as Earn's /api/user/create did. `created` is false when it
    // already existed.
    readonly ensure: (
      privyDid: string,
      email: string,
    ) => Effect.Effect<
      { readonly created: boolean },
      EmailTaken | Database.DatabaseError
    >;
  }
>()('earn/Users') {}

const make = Effect.gen(function* () {
  const database = yield* Database.Database;

  const viewer = Effect.fn('Users.viewer')(function* (privyDid: string) {
    const row = yield* database.query('viewer', (client) =>
      client.user.findUnique({ where: { privyDid }, select: VIEWER }),
    );
    return Option.fromNullishOr(row);
  });

  const lookup = (privyDid: string) =>
    database.query('writer', (client) =>
      client.user.findUnique({
        where: { privyDid },
        select: {
          id: true,
          isBlocked: true,
          role: true,
          currentSponsorId: true,
          hackathonId: true,
        },
      }),
    );

  const writer = Effect.fn('Users.writer')(function* (privyDid: string) {
    const user = yield* lookup(privyDid);
    if (!user) return yield* new NoAccount();
    if (user.isBlocked) return yield* new Blocked();
    return { userId: user.id, privyDid } satisfies Writer;
  });

  const sponsorWriter = Effect.fn('Users.sponsorWriter')(function* (
    privyDid: string,
  ) {
    const user = yield* lookup(privyDid);
    if (!user) return yield* new NoAccount();
    if (user.isBlocked) return yield* new Blocked();
    if (!user.currentSponsorId) return yield* new NoSponsor();
    return {
      userId: user.id,
      privyDid,
      sponsorId: user.currentSponsorId,
      role: user.role,
      god: user.role === 'GOD',
      hackathonId: user.hackathonId,
    } satisfies SponsorWriter;
  });

  const ensure = Effect.fn('Users.ensure')(function* (
    privyDid: string,
    rawEmail: string,
  ) {
    const email = rawEmail.trim().toLowerCase();
    const existing = yield* database.query('userByPrivyDid', (client) =>
      client.user.findUnique({ where: { privyDid }, select: { id: true } }),
    );
    if (existing) return { created: false };
    const byEmail = yield* database.query('userByEmail', (client) =>
      client.user.findUnique({
        where: { email },
        select: { privyDid: true },
      }),
    );
    if (byEmail) {
      if (byEmail.privyDid === privyDid) return { created: false };
      return yield* new EmailTaken();
    }
    return yield* database
      .query('createUser', (client) =>
        client.user.create({ data: { privyDid, email }, select: { id: true } }),
      )
      .pipe(
        Effect.as({ created: true }),
        // Lost a race with another sign-in for the same email.
        Effect.catchIf(
          (error) =>
            error.cause instanceof Prisma.PrismaClientKnownRequestError &&
            error.cause.code === 'P2002',
          () => Effect.fail(new EmailTaken()),
        ),
      );
  });

  return Users.of({ viewer, writer, sponsorWriter, ensure });
});

export const layer = Layer.effect(Users, make);
