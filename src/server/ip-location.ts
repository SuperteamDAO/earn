import 'server-only';

import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Schema from 'effect/Schema';

export class LocationUnavailable extends Schema.TaggedError<LocationUnavailable>()(
  'LocationUnavailable',
  {},
) {
  override get message() {
    return 'Failed to fetch location';
  }
}

export type Location = Record<string, unknown> & { country_code?: string };

const IPAPI = 'https://ipapi.co/json/';

// Where a visitor is, for prefilling a profile's country: Vercel's country
// header when it has one, ipapi.co's answer otherwise (as Earn did).
export class IpLocation extends Context.Service<
  IpLocation,
  {
    readonly lookup: (
      vercelCountry: string | null,
    ) => Effect.Effect<Location, LocationUnavailable>;
  }
>()('earn/IpLocation') {}

const make = Effect.succeed(
  IpLocation.of({
    lookup: Effect.fn('IpLocation.lookup')(function* (
      vercelCountry: string | null,
    ) {
      const code = vercelCountry?.trim();
      if (code && code.toUpperCase() !== 'XX') return { country_code: code };
      const body = yield* Effect.tryPromise({
        try: () =>
          fetch(IPAPI, {
            headers: {
              Accept: 'application/json',
              'User-Agent': 'superteam-earn-location',
            },
            signal: AbortSignal.timeout(10_000),
          }).then((response): Promise<unknown> =>
            response.ok ? response.json() : Promise.reject(new Error('ipapi')),
          ),
        catch: () => new LocationUnavailable(),
      });
      return yield* Schema.decodeUnknownEffect(
        Schema.Record(Schema.String, Schema.Unknown),
      )(body).pipe(Effect.mapError(() => new LocationUnavailable()));
    }),
  }),
);

export const layer = Layer.effect(IpLocation, make);
