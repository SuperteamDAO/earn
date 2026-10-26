import 'server-only';

import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Schema from 'effect/Schema';
import { unfurl } from 'unfurl.js';

import * as Database from '@/server/database';
import * as ImageStore from '@/server/image-store';
import * as RateLimits from '@/server/rate-limits';
import { isSafeRemoteUrl, safeRemoteFetch } from '@/utils/safeRemoteFetch';

type OgMetadata = NonNullable<Awaited<ReturnType<typeof unfurl>>['open_graph']>;
// 'error' is how Earn stores and answers "no preview".
export type OgMetadataResult = OgMetadata | 'error';

export const OgImageTarget = Schema.Literals(['submission', 'pow']);
export type OgImageTarget = typeof OgImageTarget.Type;

export class OgRecordNotFound extends Schema.TaggedError<OgRecordNotFound>()(
  'OgRecordNotFound',
  {},
) {
  override get message() {
    return 'Record not found';
  }
}

export class OgImageExists extends Schema.TaggedError<OgImageExists>()(
  'OgImageExists',
  {},
) {
  override get message() {
    return 'Image already exists';
  }
}

export class OgNoSource extends Schema.TaggedError<OgNoSource>()(
  'OgNoSource',
  {},
) {
  override get message() {
    return 'Record has no source URL';
  }
}

const HEADERS = {
  Accept: 'text/html, application/xhtml+xml',
  'User-Agent': 'facebookexternalhit',
};
const TIMEOUT_MS = 5000;
const MAX_BYTES = 1024 * 1024;

const withScheme = (url: string) => {
  const trimmed = url.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

// The image Earn keeps for a record: the preview's first image, or 'error'.
export const ogImageValue = (
  result: 'error' | { images?: Array<{ url?: string }> },
): string =>
  result === 'error' ? 'error' : result.images?.[0]?.url || 'error';

// Link previews (Open Graph) for submissions and personal projects, read
// from the linked page, as Earn's /api/og routes did. The page is fetched
// only at a public address, with a size and time limit.
export class OgImages extends Context.Service<
  OgImages,
  {
    // null without a URL (counted against the limit all the same).
    readonly metadata: (
      url: string | null,
      ip: string,
    ) => Effect.Effect<OgMetadataResult | null, RateLimits.RateLimited>;
    // Reads and stores a record's preview image once, for everyone after.
    readonly update: (
      userId: string,
      type: OgImageTarget,
      id: string,
    ) => Effect.Effect<
      string,
      | RateLimits.RateLimited
      | OgRecordNotFound
      | OgImageExists
      | OgNoSource
      | Database.DatabaseError
    >;
  }
>()('earn/OgImages') {}

const make = Effect.gen(function* () {
  const database = yield* Database.Database;
  const store = yield* ImageStore.ImageStore;
  const limits = yield* RateLimits.RateLimits;

  const read = (sourceUrl: string): Effect.Effect<OgMetadataResult> =>
    Effect.tryPromise(async (): Promise<OgMetadataResult> => {
      const target = withScheme(sourceUrl);
      if (!(await isSafeRemoteUrl(new URL(target)))) return 'error';
      const metadata = await unfurl(target, {
        oembed: false,
        follow: 0,
        timeout: TIMEOUT_MS,
        size: MAX_BYTES,
        headers: HEADERS,
        fetch: (url: string) =>
          safeRemoteFetch(url, {
            headers: HEADERS,
            timeoutMs: TIMEOUT_MS,
            maxResponseBytes: MAX_BYTES,
          }),
      });
      const openGraph = metadata.open_graph;
      const image = openGraph?.images?.[0];
      if (!openGraph || !image?.url) return 'error';
      image.url = store.fetchUrl(image.url) ?? image.url;
      return openGraph;
    }).pipe(
      Effect.timeout(TIMEOUT_MS),
      Effect.catch(() =>
        Effect.logWarning('Unfurling a link failed').pipe(
          Effect.as<OgMetadataResult>('error'),
        ),
      ),
    );

  const metadata = Effect.fn('OgImages.metadata')(function* (
    url: string | null,
    ip: string,
  ) {
    yield* limits.check('ogMetadata', ip);
    if (!url) return null;
    return yield* read(url);
  });

  const update = Effect.fn('OgImages.update')(function* (
    userId: string,
    type: OgImageTarget,
    id: string,
  ) {
    yield* limits.check('ogImageUpdate', userId);
    const query = {
      where: { id },
      select: { link: true, ogImage: true },
    } as const;
    const record = yield* database.query('ogRecord', (client) =>
      type === 'submission'
        ? client.submission.findUnique(query)
        : client.poW.findUnique(query),
    );
    if (!record) return yield* new OgRecordNotFound();
    if (record.ogImage && record.ogImage !== 'error') {
      return yield* new OgImageExists();
    }
    if (!record.link) return yield* new OgNoSource();

    const imageUrl = ogImageValue(yield* read(record.link));
    // Only while it's still unset: a racing request keeps its own.
    const change = {
      where: { id, OR: [{ ogImage: null }, { ogImage: 'error' }] },
      data: { ogImage: imageUrl },
    };
    const updated = yield* database.query('ogUpdate', (client) =>
      type === 'submission'
        ? client.submission.updateMany(change)
        : client.poW.updateMany(change),
    );
    if (updated.count !== 1) return yield* new OgImageExists();
    return imageUrl;
  });

  return OgImages.of({ metadata, update });
});

export const layer = Layer.effect(OgImages, make);
