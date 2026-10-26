import 'server-only';

import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import { cookies } from 'next/headers';
import { cache } from 'react';

import { runtime } from '@/server/runtime';
import * as Sessions from '@/server/sessions';
import * as Users from '@/server/users';

// Who's asking: Privy's hour-long token, or Earn's own 30-day session
// cookie once that lapses (src/server/sessions.ts). The only identity the
// server trusts.
export const getSession = cache(async (): Promise<Sessions.Session | null> => {
  const jar = await cookies();
  return runtime.runPromise(
    Sessions.Sessions.use((sessions) =>
      sessions.current((name) => jar.get(name)?.value),
    ).pipe(Effect.map(Option.getOrNull)),
  );
});

// Privy's `privy-session` cookie: Privy holds a refresh token in this
// browser. Only a hint, never trusted for who they are. SameSite=Strict, so
// a request from another site's link arrives without it.
export const hasPrivySession = cache(async (): Promise<boolean> =>
  (await cookies()).has('privy-session'),
);

// No session, yet Privy may still have one: this browser has no Earn
// session cookie yet, or it ran out. Pages renew it in place (see
// src/app/session-renewal.ts) rather than show them signed out.
export const canResume = cache(
  async (): Promise<boolean> =>
    !(await getSession()) && (await hasPrivySession()),
);

// The email Privy verified for them, from Privy's signed identity token.
export async function getSignInEmail(userId: string): Promise<string | null> {
  const token = (await cookies()).get('privy-id-token')?.value;
  if (!token) return null;
  return runtime.runPromise(
    Sessions.Sessions.use((sessions) =>
      sessions.signInEmail(token, userId),
    ).pipe(Effect.map(Option.getOrNull)),
  );
}

// The signed-in person's Earn account, looked up once per request however
// many components ask. null when signed out, without an Earn account, or
// when the lookup fails.
export const getViewer = cache(async (): Promise<Users.Viewer | null> => {
  const session = await getSession();
  if (!session) return null;
  return runtime.runPromise(
    Users.Users.use((users) => users.viewer(session.userId)).pipe(
      Effect.map(Option.getOrNull),
      Effect.catchTag('DatabaseError', () => Effect.succeed(null)),
    ),
  );
});
