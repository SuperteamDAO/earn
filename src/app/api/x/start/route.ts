import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import { NextResponse, type NextRequest } from 'next/server';

import { decodeBody, guardWrite, json } from '@/lib/route-guard';
import { safeNext } from '@/lib/safe-next';
import * as AppConfig from '@/server/app-config';
import { runtime } from '@/server/runtime';
import * as XAccounts from '@/server/x-accounts';

import { X_COOKIE, X_COOKIE_PATH } from '../cookie';

const Body = Schema.Struct({ next: Schema.optional(Schema.String) });

// Starts X's sign-in, to verify an X account: answers with X's address,
// which the page opens itself (in a popup, or the whole tab). The state
// and PKCE verifier wait in a short-lived cookie only the callback gets;
// X sends them back to `next` (a path on Earn).
export function POST(request: NextRequest) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const privyDid = yield* guardWrite(request);
      if (typeof privyDid !== 'string') return privyDid;
      const body = yield* decodeBody(request, Body, 4 * 1024);
      if (body instanceof NextResponse) return body;
      const next = safeNext(body.next);
      const config = yield* AppConfig.AppConfig;
      return yield* XAccounts.XAccounts.use((x) => x.authorize).pipe(
        Effect.map((authorization) => {
          const response = NextResponse.json({ url: authorization.url });
          response.cookies.set(
            X_COOKIE,
            JSON.stringify({
              state: authorization.state,
              verifier: authorization.verifier,
              next,
            }),
            {
              httpOnly: true,
              secure: config.isProduction,
              // X's redirect back is a top-level navigation from x.com.
              sameSite: 'lax',
              path: X_COOKIE_PATH,
              maxAge: 600,
            },
          );
          return response;
        }),
        Effect.catchTag('XRefused', () =>
          Effect.succeed(json(503, { error: 'unavailable' })),
        ),
      );
    }),
  );
}
