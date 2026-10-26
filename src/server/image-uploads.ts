import 'server-only';

import * as Clock from 'effect/Clock';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';
import * as Schema from 'effect/Schema';

import { extractPublicIdFromUrl } from '@/lib/image-upload/client';
import {
  IMAGE_SOURCES,
  isGrantImageSource,
  type GrantImageSource,
  type SignedUploadParams,
} from '@/lib/image-upload/types';
import * as Database from '@/server/database';
import * as ImageStore from '@/server/image-store';

// Earn's limits (lib/image-upload/schemas.ts).
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_FILE_SIZE_LARGE = 15 * 1024 * 1024;

// Earn's per-user signing limit, counted per server process as Earn did.
const RATE_LIMIT = { maxRequests: 20, windowMs: 60 * 1000 } as const;

const PositiveInt = Schema.Finite.check(
  Schema.makeFilter(
    (value: number) => (Number.isInteger(value) && value > 0) || 'positive',
  ),
);

export const SignRequest = Schema.Struct({
  source: Schema.Literals(IMAGE_SOURCES),
  contentType: Schema.optional(
    Schema.Literals([
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
    ]),
  ),
  contentLength: Schema.optional(PositiveInt),
  width: Schema.optional(
    PositiveInt.check(Schema.makeFilter((value: number) => value <= 4096)),
  ),
  height: Schema.optional(
    PositiveInt.check(Schema.makeFilter((value: number) => value <= 4096)),
  ),
});
export type SignRequest = typeof SignRequest.Type;

export const DeleteRequest = Schema.Struct({
  publicId: Schema.String.check(
    Schema.makeFilter(
      (value: string) =>
        (value.length >= 1 &&
          value.length <= 500 &&
          /^[a-zA-Z0-9_\-/]+$/.test(value)) ||
        'invalid public id',
    ),
  ),
  source: Schema.Literals(IMAGE_SOURCES),
});
export type DeleteRequest = typeof DeleteRequest.Type;

export interface RateInfo {
  readonly remaining: number;
  readonly resetAt: number;
  readonly retryAfter?: number;
}

// The X-RateLimit headers Earn sent with every signing answer.
export const rateHeaders = (rate: RateInfo): Record<string, string> => ({
  'X-RateLimit-Limit': String(RATE_LIMIT.maxRequests),
  'X-RateLimit-Remaining': String(rate.remaining),
  'X-RateLimit-Reset': String(Math.ceil(rate.resetAt / 1000)),
  ...(rate.retryAfter === undefined
    ? {}
    : { 'Retry-After': String(rate.retryAfter) }),
});

export class UploadRateLimited extends Schema.TaggedError<UploadRateLimited>()(
  'UploadRateLimited',
  {
    remaining: Schema.Finite,
    resetAt: Schema.Finite,
    retryAfter: Schema.Finite,
  },
) {
  override get message() {
    return 'Too many upload requests. Please try again later.';
  }
}

export class InvalidImageRequest extends Schema.TaggedError<InvalidImageRequest>()(
  'InvalidImageRequest',
  {
    // 'body': malformed; 'folder': the public id isn't in its source's folder.
    reason: Schema.Literals(['body', 'folder']),
  },
) {
  override get message() {
    return `Invalid image request: ${this.reason}`;
  }
}

export class ImageUserNotFound extends Schema.TaggedError<ImageUserNotFound>()(
  'ImageUserNotFound',
  {},
) {
  override get message() {
    return 'User not found';
  }
}

export class ImageForbidden extends Schema.TaggedError<ImageForbidden>()(
  'ImageForbidden',
  {
    // Which of Earn's refusals: kept so the route answers with Earn's words.
    reason: Schema.Literals([
      'descriptionUpload',
      'descriptionDelete',
      'userPhoto',
      'sponsorLogo',
      'sponsorRole',
      'grant',
      'unknownSource',
    ]),
  },
) {
  override get message() {
    return `Image action forbidden: ${this.reason}`;
  }
}

export class ImageInUse extends Schema.TaggedError<ImageInUse>()('ImageInUse', {
  bountyId: Schema.String,
  bountyTitle: Schema.String,
}) {
  override get message() {
    return 'Image is used in a listing description';
  }
}

export class ImageNotFound extends Schema.TaggedError<ImageNotFound>()(
  'ImageNotFound',
  {},
) {
  override get message() {
    return 'Image not found';
  }
}

export class ImageUploads extends Context.Service<
  ImageUploads,
  {
    // Earn's /api/image/sign: counts the request against the user's limit,
    // then signs an upload into the source's folder.
    readonly sign: (
      userId: string,
      body: unknown,
    ) => Effect.Effect<
      {
        readonly params: SignedUploadParams & {
          readonly contentType: SignRequest['contentType'];
          readonly contentLength: SignRequest['contentLength'];
        };
        readonly rate: RateInfo;
      },
      | UploadRateLimited
      | InvalidImageRequest
      | ImageUserNotFound
      | ImageForbidden
      | ImageStore.ImageStoreError
      | Database.DatabaseError
    >;
    // Earn's /api/image/delete: deletes an uploaded image the user may
    // delete, never one a live listing's description still shows.
    readonly remove: (
      userId: string,
      request: DeleteRequest,
    ) => Effect.Effect<
      void,
      | InvalidImageRequest
      | ImageUserNotFound
      | ImageForbidden
      | ImageInUse
      | ImageNotFound
      | ImageStore.ImageStoreError
      | Database.DatabaseError
    >;
  }
>()('earn/ImageUploads') {}

const escapeLikePattern = (value: string) =>
  value.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');

const jsonContainsPublicId = (value: unknown, publicId: string) =>
  Array.isArray(value) &&
  value.some(
    (item) =>
      typeof item === 'string' && extractPublicIdFromUrl(item) === publicId,
  );

const TRANCHE_FIELD = {
  'grant-event-pictures': 'eventPictures',
  'grant-event-receipts': 'eventReceipts',
  'grant-agentic-receipts': 'aiReceipts',
} as const satisfies Record<GrantImageSource, string>;

const make = Effect.gen(function* () {
  const database = yield* Database.Database;
  const store = yield* ImageStore.ImageStore;
  const windows = new Map<string, { count: number; windowStart: number }>();

  const countRequest = Effect.fn('ImageUploads.countRequest')(function* (
    userId: string,
  ) {
    const now = yield* Clock.currentTimeMillis;
    for (const [key, entry] of windows) {
      if (entry.windowStart + RATE_LIMIT.windowMs * 2 < now)
        windows.delete(key);
    }
    const existing = windows.get(userId);
    if (!existing || existing.windowStart + RATE_LIMIT.windowMs < now) {
      windows.set(userId, { count: 1, windowStart: now });
      return {
        remaining: RATE_LIMIT.maxRequests - 1,
        resetAt: now + RATE_LIMIT.windowMs,
      } satisfies RateInfo;
    }
    const resetAt = existing.windowStart + RATE_LIMIT.windowMs;
    if (existing.count >= RATE_LIMIT.maxRequests) {
      return yield* new UploadRateLimited({
        remaining: 0,
        resetAt,
        retryAfter: Math.max(Math.ceil((resetAt - now) / 1000), 1),
      });
    }
    existing.count += 1;
    return {
      remaining: RATE_LIMIT.maxRequests - existing.count,
      resetAt,
    } satisfies RateInfo;
  });

  const sign = Effect.fn('ImageUploads.sign')(function* (
    userId: string,
    body: unknown,
  ) {
    const rate = yield* countRequest(userId);
    const request = Schema.decodeUnknownOption(SignRequest)(body);
    if (Option.isNone(request)) {
      return yield* new InvalidImageRequest({ reason: 'body' });
    }
    const { source, contentType, contentLength } = request.value;
    const maxSize = isGrantImageSource(source)
      ? MAX_FILE_SIZE_LARGE
      : MAX_FILE_SIZE;
    if (contentLength !== undefined && contentLength > maxSize) {
      return yield* new InvalidImageRequest({ reason: 'body' });
    }

    if (source === 'description') {
      const user = yield* database.query('imageSignUser', (client) =>
        client.user.findUnique({
          where: { id: userId },
          select: {
            currentSponsorId: true,
            UserSponsors: { select: { sponsorId: true } },
          },
        }),
      );
      if (!user) return yield* new ImageUserNotFound();
      if (!user.currentSponsorId && user.UserSponsors.length === 0) {
        return yield* new ImageForbidden({ reason: 'descriptionUpload' });
      }
    }

    const params = yield* store.signUpload(source, userId);
    return { params: { ...params, contentType, contentLength }, rate };
  });

  const remove = Effect.fn('ImageUploads.remove')(function* (
    userId: string,
    { publicId, source }: DeleteRequest,
  ) {
    if (!publicId.startsWith(`${store.folder(source)}/`)) {
      return yield* new InvalidImageRequest({ reason: 'folder' });
    }

    const user = yield* database.query('imageDeleteUser', (client) =>
      client.user.findUnique({
        where: { id: userId },
        select: {
          photo: true,
          currentSponsorId: true,
          currentSponsor: { select: { logo: true } },
          UserSponsors: { select: { sponsorId: true, role: true } },
        },
      }),
    );
    if (!user) return yield* new ImageUserNotFound();

    if (source === 'description') {
      if (!user.currentSponsorId && user.UserSponsors.length === 0) {
        return yield* new ImageForbidden({ reason: 'descriptionDelete' });
      }
      const bounty = yield* database.query('imageInDescription', (client) =>
        client.bounties.findFirst({
          where: {
            isActive: true,
            isArchived: false,
            description: { contains: escapeLikePattern(publicId) },
          },
          select: { id: true, title: true },
        }),
      );
      if (bounty) {
        return yield* new ImageInUse({
          bountyId: bounty.id,
          bountyTitle: bounty.title,
        });
      }
    } else if (source === 'user') {
      const isPersistedPhoto =
        !!user.photo && extractPublicIdFromUrl(user.photo) === publicId;
      const isOwnedUpload =
        !isPersistedPhoto && (yield* store.ownerOf(publicId)) === userId;
      if (!isPersistedPhoto && !isOwnedUpload) {
        return yield* new ImageForbidden({ reason: 'userPhoto' });
      }
    } else if (source === 'sponsor') {
      const logo = user.currentSponsor?.logo;
      const isPersistedLogo =
        !!logo && extractPublicIdFromUrl(logo) === publicId;
      const isOwnedUpload =
        !isPersistedLogo && (yield* store.ownerOf(publicId)) === userId;
      if (!isPersistedLogo && !isOwnedUpload) {
        return yield* new ImageForbidden({ reason: 'sponsorLogo' });
      }
      const hasAccess =
        !isPersistedLogo ||
        user.UserSponsors.some(
          (membership) =>
            membership.sponsorId === user.currentSponsorId &&
            (membership.role === 'ADMIN' || membership.role === 'MEMBER'),
        );
      if (!hasAccess) {
        return yield* new ImageForbidden({ reason: 'sponsorRole' });
      }
    } else if (isGrantImageSource(source)) {
      const field = TRANCHE_FIELD[source];
      const tranches = yield* database.query('imageGrantTranches', (client) =>
        client.grantTranche.findMany({
          where: { GrantApplication: { userId } },
          select: {
            eventPictures: true,
            eventReceipts: true,
            aiReceipts: true,
          },
        }),
      );
      const isLegacyOwner = tranches.some((tranche) =>
        jsonContainsPublicId(tranche[field], publicId),
      );
      const isMetadataOwner =
        !isLegacyOwner && (yield* store.ownerOf(publicId)) === userId;
      if (!isLegacyOwner && !isMetadataOwner) {
        return yield* new ImageForbidden({ reason: 'grant' });
      }
    } else {
      // Default-deny: a new source gets no delete access until it has a
      // policy here.
      return yield* new ImageForbidden({ reason: 'unknownSource' });
    }

    if (!(yield* store.destroy(publicId))) return yield* new ImageNotFound();
    return undefined;
  });

  return ImageUploads.of({ sign, remove });
});

export const layer = Layer.effect(ImageUploads, make);
