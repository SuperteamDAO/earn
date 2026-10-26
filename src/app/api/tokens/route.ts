import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import { NextResponse, type NextRequest } from 'next/server';

import { decodeBody, guardSponsor, json } from '@/lib/route-guard';
import { runtime } from '@/server/runtime';
import * as Tokens from '@/server/tokens';

const noStore = (status: number, body: unknown) =>
  NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  });

// The token list, or with ?query= a search of Earn's tokens and Jupiter's
// (the token picker).
export function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('query')?.trim() ?? '';
  return runtime.runPromise(
    Tokens.Tokens.use((tokens) =>
      query
        ? tokens.search(query)
        : tokens.list.pipe(Effect.map((list) => ({ tokens: list }))),
    ).pipe(
      Effect.map((body) => noStore(200, body)),
      Effect.orElseSucceed(() =>
        noStore(500, { error: 'Failed to load token metadata' }),
      ),
    ),
  );
}

const Body = Schema.Struct({ mintAddress: Schema.String });

// A sponsor adds a token Jupiter verifies.
export function POST(request: NextRequest) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const sponsor = yield* guardSponsor(request);
      if (sponsor instanceof NextResponse) return sponsor;
      const body = yield* decodeBody(request, Body, 1024);
      if (body instanceof NextResponse) return body;
      const mintAddress = body.mintAddress.trim();
      if (!mintAddress) {
        return json(400, { error: 'Mint address is required' });
      }
      return yield* Tokens.Tokens.use((tokens) =>
        tokens.addFromJupiter(mintAddress),
      ).pipe(
        Effect.map((token) => noStore(200, { token })),
        Effect.catchTags({
          TokenRefused: (error) =>
            Effect.succeed(
              error.reason === 'not-found'
                ? json(404, { error: 'Token not found on Jupiter' })
                : error.reason === 'unverified'
                  ? json(400, { error: 'Token is not verified' })
                  : json(409, { error: 'Token symbol already exists' }),
            ),
          JupiterUnavailable: () =>
            Effect.succeed(
              json(500, { error: 'Failed to load token metadata' }),
            ),
          DatabaseError: () =>
            Effect.succeed(
              json(500, { error: 'Failed to load token metadata' }),
            ),
        }),
      );
    }),
  );
}
