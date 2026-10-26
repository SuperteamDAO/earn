import * as Effect from 'effect/Effect';
import type { NextRequest } from 'next/server';

import { clientIp, json } from '@/lib/route-guard';
import * as OgImages from '@/server/og-images';
import { runtime } from '@/server/runtime';

import { rateLimited } from '../rate-limited';

// A link's preview (Open Graph), for cards that show one.
export function GET(request: NextRequest) {
  return runtime.runPromise(
    OgImages.OgImages.use((og) =>
      og.metadata(request.nextUrl.searchParams.get('url'), clientIp(request)),
    ).pipe(
      Effect.map((result) =>
        result === null
          ? json(400, { error: 'URL is required and must be a string.' })
          : json(200, { result }),
      ),
      Effect.catchTag('RateLimited', (error) =>
        Effect.succeed(rateLimited(error)),
      ),
    ),
  );
}
