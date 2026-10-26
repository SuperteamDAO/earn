import 'server-only';

import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Redacted from 'effect/Redacted';
import * as Schema from 'effect/Schema';

import * as AppConfig from '@/server/app-config';

export class ImageCheckFailed extends Schema.TaggedError<ImageCheckFailed>()(
  'ImageCheckFailed',
  { status: Schema.optional(Schema.Finite) },
) {
  override get message() {
    return `Image check failed${this.status ? ` (${this.status})` : ''}`;
  }
}

// What the sponsor forms ask of services outside Earn: whether an uploaded
// logo is really in Earn's Cloudinary, and keeping the GDP Airtable's
// sponsor names in step with Earn's.
export class SponsorIntegrations extends Context.Service<
  SponsorIntegrations,
  {
    // As Earn's verifyImageExists: false when Cloudinary has no such image
    // (or it isn't a Cloudinary URL), failing when Cloudinary can't say.
    readonly imageExists: (
      url: string,
    ) => Effect.Effect<boolean, ImageCheckFailed>;
    // Renames the sponsor's GDP record. Failures are logged, never raised:
    // the rename in Earn has already happened.
    readonly renameGdpSponsor: (
      from: string,
      to: string,
    ) => Effect.Effect<void>;
  }
>()('earn/SponsorIntegrations') {}

// Earn's extractPublicIdFromUrl: the path after `/upload/`, past any
// transformations and the version, without the extension.
export function cloudinaryPublicId(url: string): string | null {
  if (!url.includes('res.cloudinary.com')) return null;
  const afterUpload = url.split('/upload/')[1];
  if (!afterUpload) return null;
  const segments = afterUpload.split('/');
  const version = segments.findIndex((segment) => /^v\d+$/.test(segment));
  const path = segments.slice(version === -1 ? 0 : version + 1).join('/');
  const dot = path.lastIndexOf('.');
  return dot === -1 ? path : path.slice(0, dot);
}

// Airtable formulas quote with single quotes.
const quoted = (value: string) =>
  `'${value.replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`;

const airtableRequest = (url: string, token: string, init?: RequestInit) =>
  Effect.tryPromise(async () => {
    const response = await fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new Error(`Airtable ${response.status}`);
    return (await response.json()) as unknown;
  });

const Records = Schema.Struct({
  records: Schema.Array(Schema.Struct({ id: Schema.String })),
});

const make = Effect.gen(function* () {
  const config = yield* AppConfig.AppConfig;

  const imageExists = Effect.fn('SponsorIntegrations.imageExists')(function* (
    url: string,
  ) {
    // Google profile photos come from sign-in, never through Cloudinary.
    if (URL.parse(url)?.hostname === 'lh3.googleusercontent.com') return true;
    const publicId = cloudinaryPublicId(url);
    if (!publicId) return false;
    const cloudinary = config.cloudinary;
    if (!cloudinary) return yield* new ImageCheckFailed({});
    const path = publicId.split('/').map(encodeURIComponent).join('/');
    const auth = btoa(
      `${cloudinary.apiKey}:${Redacted.value(cloudinary.apiSecret)}`,
    );
    const response = yield* Effect.tryPromise({
      try: () =>
        fetch(
          `https://api.cloudinary.com/v1_1/${cloudinary.cloudName}/resources/image/upload/${path}`,
          {
            headers: { Authorization: `Basic ${auth}` },
            signal: AbortSignal.timeout(10_000),
          },
        ),
      catch: () => new ImageCheckFailed({}),
    });
    if (response.status === 404) return false;
    if (!response.ok) {
      return yield* new ImageCheckFailed({ status: response.status });
    }
    return true;
  });

  const renameGdpSponsor = Effect.fn('SponsorIntegrations.renameGdpSponsor')(
    function* (from: string, to: string) {
      const airtable = config.airtable;
      if (!airtable?.gdpBase || !airtable.gdpSponsorsTable) {
        yield* Effect.logError(
          'Airtable update of sponsor name failed: not configured',
        );
        return;
      }
      const token = Redacted.value(airtable.token);
      const table = `https://api.airtable.com/v0/${airtable.gdpBase}/${airtable.gdpSponsorsTable}`;
      yield* Effect.gen(function* () {
        const found = yield* airtableRequest(
          `${table}?${new URLSearchParams({
            filterByFormula: `{Name} = ${quoted(from)}`,
            maxRecords: '1',
          })}`,
          token,
        ).pipe(Effect.flatMap(Schema.decodeUnknownEffect(Records)));
        const record = found.records[0];
        if (!record) return;
        yield* airtableRequest(table, token, {
          method: 'PATCH',
          body: JSON.stringify({
            records: [{ id: record.id, fields: { Name: to } }],
          }),
        });
      }).pipe(
        Effect.catch(() =>
          Effect.logError('Airtable update of sponsor name failed'),
        ),
      );
    },
  );

  return SponsorIntegrations.of({ imageExists, renameGdpSponsor });
});

export const layer = Layer.effect(SponsorIntegrations, make);
