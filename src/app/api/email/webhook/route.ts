import * as Effect from 'effect/Effect';
import type { NextRequest } from 'next/server';

import { json, readBody } from '@/lib/route-guard';
import * as EmailPreferences from '@/server/email-preferences';
import { runtime } from '@/server/runtime';

// Resend's delivery events, signed by Svix.
export function POST(request: NextRequest) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const payload = yield* readBody(request);
      if (payload === null) return json(413, { error: 'size' });
      const header = (name: string) => request.headers.get(name) ?? '';
      return yield* EmailPreferences.EmailPreferences.use((preferences) =>
        preferences.recordDelivery(payload, {
          'svix-id': header('svix-id'),
          'svix-timestamp': header('svix-timestamp'),
          'svix-signature': header('svix-signature'),
        }),
      ).pipe(
        Effect.as(new Response(null, { status: 200 })),
        Effect.catchTags({
          BadSignature: () =>
            Effect.succeed(json(400, { error: 'Invalid signature' })),
          NoRecipient: () =>
            Effect.succeed(json(400, { error: 'No recipient email found' })),
          NotConfigured: () =>
            Effect.succeed(json(500, { error: 'Internal Server Error' })),
          DatabaseError: () =>
            Effect.succeed(json(500, { error: 'Internal Server Error' })),
        }),
      );
    }),
  );
}
