import * as Effect from 'effect/Effect';
import { NextResponse, type NextRequest } from 'next/server';

import { json } from '@/lib/route-guard';
import * as IpLocation from '@/server/ip-location';
import { runtime } from '@/server/runtime';

// The visitor's country, for talent onboarding's location field.
export function GET(request: NextRequest) {
  return runtime.runPromise(
    IpLocation.IpLocation.use((location) =>
      location.lookup(request.headers.get('x-vercel-ip-country')),
    ).pipe(
      Effect.map((location) =>
        NextResponse.json(location, {
          headers: { 'Cache-Control': 'private, max-age=300' },
        }),
      ),
      Effect.catchTag('LocationUnavailable', () =>
        Effect.succeed(json(502, { error: 'Failed to fetch location' })),
      ),
    ),
  );
}
