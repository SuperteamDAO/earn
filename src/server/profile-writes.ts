import 'server-only';

import * as Clock from 'effect/Clock';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Schema from 'effect/Schema';

import * as Database from '@/server/database';
import * as ImageStore from '@/server/image-store';
import * as PrivyApi from '@/server/privy-api';
import { VIEWER, type Viewer } from '@/server/users';
import { cleanSkills } from '@/utils/cleanSkills';

import { extractSocialUsername } from '@/features/social/utils/extractUsername';
import {
  checkProfile,
  type FieldErrors,
  type ProfileBody,
  type ProfileData,
  socialErrors,
} from '@/features/talent/utils/profile-input';

export class ProfileUserMissing extends Schema.TaggedError<ProfileUserMissing>()(
  'ProfileUserMissing',
  {},
) {
  override get message() {
    return 'User not found';
  }
}

export class InvalidProfile extends Schema.TaggedError<InvalidProfile>()(
  'InvalidProfile',
  { errors: Schema.Record(Schema.String, Schema.Array(Schema.String)) },
) {
  override get message() {
    return `Invalid profile: ${Object.keys(this.errors).join(', ')}`;
  }
}

// The photo isn't an image Earn stored.
export class PhotoMissing extends Schema.TaggedError<PhotoMissing>()(
  'PhotoMissing',
  {},
) {
  override get message() {
    return 'Invalid photo: Image does not exist in our storage';
  }
}

export class SponsorForbidden extends Schema.TaggedError<SponsorForbidden>()(
  'SponsorForbidden',
  {},
) {
  override get message() {
    return 'You do not have access to this sponsor profile';
  }
}

export class NothingToUpdate extends Schema.TaggedError<NothingToUpdate>()(
  'NothingToUpdate',
  {},
) {
  override get message() {
    return 'No valid fields provided for update';
  }
}

// What /api/user/update/ may change (Earn's allowed fields there).
export const AccountBody = Schema.Struct({
  featureModalShown: Schema.optional(Schema.Boolean),
  acceptedTOS: Schema.optional(Schema.Boolean),
  currentSponsorId: Schema.optional(Schema.NullOr(Schema.String)),
  hackathonId: Schema.optional(Schema.NullOr(Schema.String)),
});
export type AccountBody = typeof AccountBody.Type;

// Earn turns on these emails for everyone who finishes a profile.
const TALENT_EMAILS = [
  'createListing',
  'commentOrLikeSubmission',
  'weeklyListingRoundup',
  'replyOrTagComment',
  'productAndNewsletter',
];

// People rows that make someone a Superteam member (features/membership).
const ELIGIBLE_PEOPLE_TYPES = ['member', 'core'];

type Refused = ProfileUserMissing | Database.DatabaseError;

export class ProfileWrites extends Context.Service<
  ProfileWrites,
  {
    // Finishes a talent profile (Earn's /api/user/complete-profile): saves
    // it, turns on the talent emails, makes their Privy Solana wallet if
    // they have none, and links their Superteam membership. Succeeds with
    // the account as the viewer reads it.
    readonly complete: (
      userId: string,
      body: ProfileBody,
    ) => Effect.Effect<
      Viewer | null,
      Refused | InvalidProfile | PhotoMissing | PrivyApi.PrivyApiError
    >;
    // Saves edits to it (Earn's /api/user/edit). Only the fields sent.
    readonly edit: (
      userId: string,
      body: ProfileBody,
    ) => Effect.Effect<
      { readonly email: string },
      Refused | InvalidProfile | PhotoMissing
    >;
    readonly emailSettings: (
      userId: string,
      categories: ReadonlyArray<string>,
    ) => Effect.Effect<void, Database.DatabaseError>;
    // Account flags and the sponsor they act for (Earn's /api/user/update).
    readonly account: (
      userId: string,
      body: AccountBody,
    ) => Effect.Effect<unknown, Refused | SponsorForbidden | NothingToUpdate>;
  }
>()('earn/ProfileWrites') {}

// Earn's normalizeSocialInput: trimmed, without a leading @, blank as unset.
const normalized = (value: string | undefined) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed.replace(/^@/, '') : undefined;
};

type Mutable<T> = { -readonly [K in keyof T]: T[K] };

const LINKED = ['github', 'twitter', 'linkedin', 'telegram'] as const;

// As Prisma takes it: skills cleaned, lists as JSON text, unset left out.
const stored = (data: ProfileData) => {
  const { skills, interests, community, ...rest } = data;
  return {
    ...rest,
    ...(skills ? { skills: cleanSkills(skills) } : {}),
    interests: interests ? JSON.stringify(interests) : undefined,
    community: community ? JSON.stringify(community) : undefined,
  };
};

const make = Effect.gen(function* () {
  const database = yield* Database.Database;
  const images = yield* ImageStore.ImageStore;
  const privy = yield* PrivyApi.PrivyApi;

  const load = (userId: string) =>
    database
      .query('profileUser', (client) =>
        client.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            privyDid: true,
            email: true,
            photo: true,
            location: true,
            walletAddress: true,
            peopleId: true,
            role: true,
          },
        }),
      )
      .pipe(
        Effect.filterOrFail(
          (user) => user !== null,
          () => new ProfileUserMissing(),
        ),
      );

  // The photo must be one Earn stored; when Cloudinary can't say, the
  // current photo stays (as Earn did).
  const checkPhoto = (photo: string, current: string | null) =>
    images.exists(photo).pipe(
      Effect.flatMap((exists) =>
        exists ? Effect.succeed(photo) : Effect.fail(new PhotoMissing()),
      ),
      Effect.catchTag('ImageStoreError', () => Effect.succeed(current)),
    );

  const usernameTaken = (username: string, userId: string) =>
    database
      .query('usernameOwner', (client) =>
        client.user.findUnique({ where: { username }, select: { id: true } }),
      )
      .pipe(Effect.map((owner) => !!owner && owner.id !== userId));

  // Earn's zod parse: the fields' own rules, then (only if they pass) the
  // cross-field ones.
  const validate = Effect.fn('ProfileWrites.validate')(function* (
    userId: string,
    body: ProfileBody,
    social: boolean,
  ) {
    const checked = checkProfile(body);
    if (!checked.ok)
      return yield* new InvalidProfile({ errors: checked.errors });
    const errors: FieldErrors = social ? socialErrors(checked.data) : {};
    const { username } = checked.data;
    if (username && (yield* usernameTaken(username, userId))) {
      errors.username = ['Username is unavailable! Please try another one.'];
    }
    if (Object.keys(errors).length > 0) {
      return yield* new InvalidProfile({ errors });
    }
    return checked.data;
  });

  // Links them to their Superteam membership by email, or unlinks a
  // lapsed one (Earn's refreshUserMembershipLevel). Never fails the save.
  const refreshMembership = (user: {
    id: string;
    email: string;
    peopleId: string | null;
  }) =>
    Effect.gen(function* () {
      const email = user.email.trim().toLowerCase();
      if (!email) return;
      if (user.peopleId) {
        const person = yield* database.query('currentPerson', (client) =>
          client.people.findUnique({
            where: { id: user.peopleId ?? '' },
            select: { type: true },
          }),
        );
        const type = person?.type?.trim().toLowerCase() ?? '';
        if (ELIGIBLE_PEOPLE_TYPES.includes(type)) return;
      }
      const match = yield* database.query('memberByEmail', (client) =>
        client.people.findFirst({
          where: { email, type: { in: ELIGIBLE_PEOPLE_TYPES } },
          orderBy: { updatedAt: 'desc' },
          select: { id: true },
        }),
      );
      yield* database.query('linkMembership', (client) =>
        client.user.updateMany({
          where: { id: user.id, email },
          data: { peopleId: match?.id ?? null },
        }),
      );
    }).pipe(
      Effect.catch(() => Effect.logWarning('Membership refresh errored')),
    );

  const viewerRow = (userId: string) =>
    database.query('viewerById', (client) =>
      client.user.findUnique({ where: { id: userId }, select: VIEWER }),
    );

  const complete = Effect.fn('ProfileWrites.complete')(function* (
    userId: string,
    body: ProfileBody,
  ) {
    const user = yield* load(userId);
    const input: Mutable<ProfileBody> = { ...body };
    if (input.photo) {
      input.photo = (yield* checkPhoto(input.photo, user.photo)) ?? undefined;
    }
    for (const key of LINKED) {
      const value = normalized(input[key]);
      input[key] = value
        ? extractSocialUsername(key, value) || value
        : undefined;
    }
    const data = yield* validate(userId, input, true);

    yield* database.query('talentEmails', (client) =>
      client.$transaction([
        client.emailSettings.deleteMany({
          where: { userId, category: { in: TALENT_EMAILS } },
        }),
        client.emailSettings.createMany({
          data: TALENT_EMAILS.map((category) => ({ userId, category })),
        }),
      ]),
    );

    const walletAddress =
      user.walletAddress ?? (yield* privy.createSolanaWallet(user.privyDid));

    yield* database.query('completeProfile', (client) =>
      client.user.update({
        where: { id: userId },
        data: { ...stored(data), isTalentFilled: true, walletAddress },
      }),
    );
    yield* refreshMembership(user);
    return yield* viewerRow(userId);
  });

  const edit = Effect.fn('ProfileWrites.edit')(function* (
    userId: string,
    body: ProfileBody,
  ) {
    const user = yield* load(userId);
    const input: Mutable<ProfileBody> = { ...body };
    for (const key of LINKED) {
      const value = input[key];
      if (value !== undefined) {
        input[key] = extractSocialUsername(key, value) || '';
      }
    }
    const data = yield* validate(userId, input, false);
    if (data.photo) {
      data.photo = yield* checkPhoto(data.photo, user.photo);
    }

    const now = yield* Clock.currentTimeMillis;
    // Earn's location cooldown starts when someone moves, not when they
    // first say where they are.
    const moved =
      data.location !== undefined &&
      data.location !== user.location &&
      Boolean(user.location?.trim());
    return yield* database.query('editProfile', (client) =>
      client.user.update({
        where: { id: userId },
        data: {
          ...stored(data),
          ...(moved ? { locationUpdatedAt: new Date(now) } : {}),
        },
        select: { email: true },
      }),
    );
  });

  const emailSettings = Effect.fn('ProfileWrites.emailSettings')(function* (
    userId: string,
    categories: ReadonlyArray<string>,
  ) {
    yield* database.query('emailSettings', (client) =>
      client.$transaction(async (tx) => {
        await tx.emailSettings.deleteMany({ where: { userId } });
        await tx.emailSettings.createMany({
          data: categories.map((category) => ({ userId, category })),
        });
        if (categories.length === 0) return;
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { email: true },
        });
        // Asking for emails again undoes an unsubscribe.
        if (user?.email) {
          await tx.unsubscribedEmail.deleteMany({
            where: { email: user.email.toLowerCase() },
          });
        }
      }),
    );
  });

  const account = Effect.fn('ProfileWrites.account')(function* (
    userId: string,
    body: AccountBody,
  ) {
    const user = yield* load(userId);
    const data: Record<string, unknown> = {};
    if (body.featureModalShown !== undefined) {
      data.featureModalShown = body.featureModalShown;
    }
    if (body.acceptedTOS !== undefined) data.acceptedTOS = body.acceptedTOS;
    if (user.role === 'GOD') {
      if (body.currentSponsorId !== undefined) {
        data.currentSponsorId = body.currentSponsorId;
      }
      if (body.hackathonId !== undefined) data.hackathonId = body.hackathonId;
    } else if (typeof body.currentSponsorId === 'string') {
      const sponsorId = body.currentSponsorId;
      const member = yield* database.query('sponsorMembership', (client) =>
        client.userSponsors.findFirst({
          where: { userId, sponsorId },
          select: { sponsorId: true },
        }),
      );
      if (!member) return yield* new SponsorForbidden();
      data.currentSponsorId = sponsorId;
    }
    if (Object.keys(data).length === 0) return yield* new NothingToUpdate();
    yield* database.query('updateAccount', (client) =>
      client.user.update({ where: { id: userId }, data }),
    );
    return yield* viewerRow(userId);
  });

  return ProfileWrites.of({ complete, edit, emailSettings, account });
});

export const layer = Layer.effect(ProfileWrites, make);
