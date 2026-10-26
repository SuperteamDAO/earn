import * as Effect from 'effect/Effect';
import type { NextRequest } from 'next/server';

import { runtime } from '@/server/runtime';
import * as Tokens from '@/server/tokens';

const CACHE_CONTROL =
  'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800';

// Token icons from anywhere, fetched safely and re-encoded, so a remote
// image never runs as a document of Earn's.
export function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  return runtime.runPromise(
    Tokens.Tokens.use((tokens) =>
      tokens.icon(params.get('url') ?? '', params.get('format') === 'png'),
    ).pipe(
      Effect.map(
        (icon) =>
          new Response(new Uint8Array(icon.image), {
            headers: {
              'Cache-Control': CACHE_CONTROL,
              'Content-Type': icon.contentType,
              'Content-Security-Policy': "default-src 'none'; sandbox",
              'X-Content-Type-Options': 'nosniff',
            },
          }),
      ),
      Effect.catchTag('IconRefused', (error) =>
        Effect.succeed(new Response(null, { status: error.status })),
      ),
    ),
  );
}
