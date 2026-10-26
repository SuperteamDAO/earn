import 'server-only';

import * as Clock from 'effect/Clock';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';
import * as Redacted from 'effect/Redacted';
import * as Schema from 'effect/Schema';
import { createHash } from 'node:crypto';

import { extractPublicIdFromUrl } from '@/lib/image-upload/client';
import type { ImageSource, SignedUploadParams } from '@/lib/image-upload/types';
import * as AppConfig from '@/server/app-config';

export class ImageStoreError extends Schema.TaggedError<ImageStoreError>()(
  'ImageStoreError',
  {
    operation: Schema.String,
    // Cloudinary isn't configured on this deployment.
    unavailable: Schema.optional(Schema.Boolean),
  },
) {
  override get message() {
    return `Cloudinary ${this.operation} failed`;
  }
}

// Earn's upload settings by source (lib/image-upload/config.ts): its
// folder (with -dev outside production) and the eager transformation.
const SOURCES: Record<ImageSource, { folder: string; eager: string }> = {
  user: { folder: 'earn-pfp', eager: 'c_fill,w_200,h_200,q_auto,f_webp' },
  sponsor: {
    folder: 'earn-sponsor',
    eager: 'c_limit,w_400,h_400,q_auto,f_webp',
  },
  description: {
    folder: 'listing-description',
    eager: 'c_limit,w_1200,q_auto,f_webp',
  },
  'grant-event-pictures': {
    folder: 'grant-event-pictures',
    eager: 'c_limit,w_1200,q_auto,f_webp',
  },
  'grant-event-receipts': {
    folder: 'grant-event-receipts',
    eager: 'c_limit,w_1200,q_auto,f_webp',
  },
  'grant-agentic-receipts': {
    folder: 'grant-agentic-receipts',
    eager: 'c_limit,w_1200,q_auto,f_webp',
  },
};

// Cloudinary's request signature: the parameters sorted by name, joined as
// a query string without encoding, then the secret, SHA-1'd.
function cloudinarySignature(
  params: Readonly<Record<string, string | number>>,
  secret: string,
): string {
  const joined = Object.keys(params)
    .toSorted()
    .map((key) => `${key}=${params[key]}`)
    .join('&');
  return createHash('sha1')
    .update(joined + secret)
    .digest('hex');
}

const RESOURCE_TYPES = ['image', 'raw'] as const;

// Earn's Cloudinary, over its REST API: signing browser uploads, checking
// and deleting what was uploaded.
export class ImageStore extends Context.Service<
  ImageStore,
  {
    readonly folder: (source: ImageSource) => string;
    // Parameters for a browser to upload straight to Cloudinary, tagged
    // with who uploaded it (Earn's generateSignedUploadParams).
    readonly signUpload: (
      source: ImageSource,
      ownerId: string,
    ) => Effect.Effect<SignedUploadParams, ImageStoreError>;
    // Whether a profile photo URL is an image Earn stored (Google's avatars
    // pass as they are), as Earn's verifyImageExists.
    readonly exists: (url: string) => Effect.Effect<boolean, ImageStoreError>;
    // Who uploaded it, from the context the signature fixed.
    readonly ownerOf: (
      publicId: string,
    ) => Effect.Effect<string | null, ImageStoreError>;
    // Deletes it; false when Cloudinary has no such asset.
    readonly destroy: (
      publicId: string,
    ) => Effect.Effect<boolean, ImageStoreError>;
    // An outside image served through Cloudinary's fetch, as Earn's
    // getCloudinaryFetchUrl.
    readonly fetchUrl: (url: string | null | undefined) => string | null;
  }
>()('earn/ImageStore') {}

const ResourceContext = Schema.Struct({
  context: Schema.optional(
    Schema.Struct({
      custom: Schema.optional(
        Schema.Struct({ owner_id: Schema.optional(Schema.String) }),
      ),
    }),
  ),
});
const DestroyResult = Schema.Struct({ result: Schema.String });

const make = Effect.gen(function* () {
  const config = yield* AppConfig.AppConfig;
  const cloudinary = config.cloudinary;
  const suffix = config.earnProduction ? '' : '-dev';

  const folder = (source: ImageSource) => `${SOURCES[source].folder}${suffix}`;

  const configured = (operation: string) =>
    cloudinary
      ? Effect.succeed(cloudinary)
      : Effect.fail(new ImageStoreError({ operation, unavailable: true }));

  const signUpload = Effect.fn('ImageStore.signUpload')(function* (
    source: ImageSource,
    ownerId: string,
  ) {
    const account = yield* configured('signUpload');
    const timestamp = Math.round((yield* Clock.currentTimeMillis) / 1000);
    const context = `owner_id=${ownerId}`;
    const { eager } = SOURCES[source];
    const params = { timestamp, folder: folder(source), context, eager };
    return {
      signature: cloudinarySignature(params, Redacted.value(account.apiSecret)),
      timestamp,
      cloudName: account.cloudName,
      apiKey: account.apiKey,
      folder: params.folder,
      context,
      eager,
    } satisfies SignedUploadParams;
  });

  // An Admin API resource lookup: the body, or null when there's none.
  const resource = (
    operation: string,
    type: (typeof RESOURCE_TYPES)[number],
    publicId: string,
  ) =>
    Effect.gen(function* () {
      const account = yield* configured(operation);
      const path = publicId.split('/').map(encodeURIComponent).join('/');
      const basic = Buffer.from(
        `${account.apiKey}:${Redacted.value(account.apiSecret)}`,
      ).toString('base64');
      const response = yield* Effect.tryPromise({
        try: () =>
          fetch(
            `https://api.cloudinary.com/v1_1/${account.cloudName}/resources/${type}/upload/${path}?context=true`,
            {
              headers: { Authorization: `Basic ${basic}` },
              signal: AbortSignal.timeout(10_000),
            },
          ),
        catch: () => new ImageStoreError({ operation }),
      });
      if (response.status === 404) return null;
      if (!response.ok) return yield* new ImageStoreError({ operation });
      return yield* Effect.tryPromise({
        try: (): Promise<unknown> => response.json(),
        catch: () => new ImageStoreError({ operation }),
      });
    });

  const exists = Effect.fn('ImageStore.exists')(function* (url: string) {
    if (URL.parse(url)?.hostname === 'lh3.googleusercontent.com') return true;
    const publicId = extractPublicIdFromUrl(url);
    if (!publicId) return false;
    return (yield* resource('exists', 'image', publicId)) !== null;
  });

  const ownerOf = Effect.fn('ImageStore.ownerOf')(function* (publicId: string) {
    for (const type of RESOURCE_TYPES) {
      const body = yield* resource('ownerOf', type, publicId);
      if (body === null) continue;
      const decoded = Schema.decodeUnknownOption(ResourceContext)(body);
      return Option.isSome(decoded)
        ? decoded.value.context?.custom?.owner_id || null
        : null;
    }
    return null;
  });

  const destroy = Effect.fn('ImageStore.destroy')(function* (publicId: string) {
    const operation = 'destroy';
    const account = yield* configured(operation);
    for (const type of RESOURCE_TYPES) {
      const timestamp = Math.round((yield* Clock.currentTimeMillis) / 1000);
      const params = { public_id: publicId, timestamp };
      const response = yield* Effect.tryPromise({
        try: () =>
          fetch(
            `https://api.cloudinary.com/v1_1/${account.cloudName}/${type}/destroy`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: new URLSearchParams({
                public_id: publicId,
                timestamp: String(timestamp),
                api_key: account.apiKey,
                signature: cloudinarySignature(
                  params,
                  Redacted.value(account.apiSecret),
                ),
              }).toString(),
              signal: AbortSignal.timeout(10_000),
            },
          ),
        catch: () => new ImageStoreError({ operation }),
      });
      if (response.status === 404) continue;
      if (!response.ok) return yield* new ImageStoreError({ operation });
      const body: unknown = yield* Effect.promise(() =>
        response.json().catch((): unknown => null),
      );
      const decoded = Schema.decodeUnknownOption(DestroyResult)(body);
      if (Option.isSome(decoded) && decoded.value.result === 'ok') {
        return true;
      }
    }
    return false;
  });

  const fetchUrl = (url: string | null | undefined): string | null => {
    if (!url || url === 'error') return null;
    if (url.includes('res.cloudinary.com')) return url;
    return `https://res.cloudinary.com/${cloudinary?.cloudName ?? ''}/image/fetch/${encodeURIComponent(url)}`;
  };

  return ImageStore.of({
    folder,
    signUpload,
    exists,
    ownerOf,
    destroy,
    fetchUrl,
  });
});

export const layer = Layer.effect(ImageStore, make);
