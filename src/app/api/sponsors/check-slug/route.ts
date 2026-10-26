import * as Effect from 'effect/Effect';
import type { NextRequest } from 'next/server';

import { json } from '@/lib/route-guard';
import { runtime } from '@/server/runtime';
import * as SponsorAccounts from '@/server/sponsor-accounts';

// Whether no sponsor has this slug yet, for the sponsor forms.
export function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug');
  if (!slug) {
    return json(400, { error: 'slug is required and must be a string.' });
  }
  return runtime.runPromise(
    SponsorAccounts.SponsorAccounts.use((accounts) =>
      accounts.slugAvailable(slug),
    ).pipe(
      Effect.map((available) => json(200, { available })),
      Effect.catchTag('DatabaseError', () =>
        Effect.succeed(
          json(500, {
            error: 'Error occurred while checking the slug availability.',
          }),
        ),
      ),
    ),
  );
}
