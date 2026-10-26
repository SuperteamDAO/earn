import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import { NextResponse, type NextRequest } from 'next/server';

import { clientIp, fromEarn, json } from '@/lib/route-guard';
import * as RateLimits from '@/server/rate-limits';
import { runtime } from '@/server/runtime';
import * as Sessions from '@/server/sessions';
import * as Users from '@/server/users';

// Issues Earn's own session cookie to whoever Privy's access token says this
// is: on sign-in, and whenever a page has Privy vouch for them again
// (src/lib/auth/session-renewal.ts). Only for Earn's own pages, and only
// from the cookie Privy's SDK wrote, never from a token in the request.
// A first sign-in also makes their Earn account, from the email in Privy's
// signed identity token. Answers whether it did (`created`), or that the
// email already has an account signing in another way (`refusal: email`).
export function POST(request: NextRequest) {
  return runtime.runPromise(
    Effect.gen(function* () {
      if (!(yield* fromEarn(request))) {
        return new NextResponse(null, { status: 403 });
      }
      const sessions = yield* Sessions.Sessions;
      const token = request.cookies.get('privy-token')?.value;
      const cookie = token ? yield* sessions.begin(token) : Option.none();
      if (Option.isNone(cookie) || !token) {
        return new NextResponse(null, { status: 401 });
      }
      const session = yield* sessions.current((name) =>
        name === 'privy-token' ? token : undefined,
      );
      const identity = request.cookies.get('privy-id-token')?.value;
      const email =
        Option.isSome(session) && identity
          ? yield* sessions.signInEmail(identity, session.value.userId)
          : Option.none<string>();

      const users = yield* Users.Users;
      const limits = yield* RateLimits.RateLimits;
      const account =
        Option.isSome(session) && Option.isSome(email)
          ? yield* users.viewer(session.value.userId).pipe(
              Effect.flatMap((existing) =>
                Option.isSome(existing)
                  ? Effect.succeed({ created: false })
                  : limits
                      .check('userCreate', clientIp(request))
                      .pipe(
                        Effect.andThen(
                          users.ensure(session.value.userId, email.value),
                        ),
                      ),
              ),
              Effect.map((result) => ({ created: result.created })),
              Effect.catchTags({
                EmailTaken: () => Effect.succeed({ refusal: 'email' }),
                RateLimited: () => Effect.succeed({ refusal: 'rate-limited' }),
                DatabaseError: () => Effect.succeed({ refusal: 'database' }),
              }),
            )
          : { created: false };

      const response = json(200, account);
      response.headers.append('Set-Cookie', cookie.value);
      return response;
    }),
  );
}
