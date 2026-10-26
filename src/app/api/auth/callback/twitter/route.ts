import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import * as Schema from 'effect/Schema';
import { NextResponse, type NextRequest } from 'next/server';

import { X_COOKIE, X_COOKIE_PATH } from '@/app/api/x/cookie';
import { sessionOf } from '@/lib/route-guard';
import { safeNext } from '@/lib/safe-next';
import * as AppConfig from '@/server/app-config';
import { runtime } from '@/server/runtime';
import * as XAccounts from '@/server/x-accounts';

const Trip = Schema.fromJsonString(
  Schema.Struct({
    state: Schema.String,
    verifier: Schema.String,
    next: Schema.String,
  }),
);

// X sends them back here (the callback registered with Earn's X app). A
// GET by necessity (OAuth's redirect), so it only acts with the state this
// browser was given, for whoever is signed in now, and only ever adds a
// handle X vouched for. Then back to where verification started, with
// `?x=verified&handle=…` or `?x=failed`.
export function GET(request: NextRequest) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const config = yield* AppConfig.AppConfig;
      const origin = config.siteOrigins[0] ?? request.nextUrl.origin;
      const trip = Schema.decodeOption(Trip)(
        request.cookies.get(X_COOKIE)?.value ?? '',
      );
      const back = (next: string, handle: string | null) => {
        const url = new URL(safeNext(next), origin);
        url.searchParams.set('x', handle ? 'verified' : 'failed');
        if (handle) url.searchParams.set('handle', handle);
        const response = NextResponse.redirect(url, 303);
        response.cookies.set(X_COOKIE, '', { path: X_COOKIE_PATH, maxAge: 0 });
        return response;
      };
      if (Option.isNone(trip)) return back('/earn/', null);
      const { state, verifier, next } = trip.value;
      const code = request.nextUrl.searchParams.get('code');
      if (request.nextUrl.searchParams.get('state') !== state || !code) {
        return back(next, null);
      }
      const privyDid = yield* sessionOf(request);
      if (Option.isNone(privyDid)) return back(next, null);
      return yield* XAccounts.XAccounts.use((x) =>
        x.link(privyDid.value, code, verifier),
      ).pipe(
        Effect.map((handle) => back(next, handle)),
        Effect.catchTags({
          XRefused: () => Effect.succeed(back(next, null)),
          DatabaseError: () => Effect.succeed(back(next, null)),
        }),
      );
    }),
  );
}
