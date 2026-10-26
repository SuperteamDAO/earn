import * as Effect from 'effect/Effect';
import { NextResponse, type NextRequest } from 'next/server';

import { fromEarn } from '@/lib/route-guard';
import * as AppConfig from '@/server/app-config';
import { runtime } from '@/server/runtime';
import * as Sessions from '@/server/sessions';

// HttpOnly in production, so only the server can clear them.
const PRIVY_COOKIES = [
  'privy-token',
  'privy-id-token',
  'privy-session',
  'privy-refresh-token',
];

// A cookie is only replaced when Domain and Path match, so expire both the
// host-only one (written by the SDK locally) and the one on Privy's domain.
function expired(name: string, secure: boolean, domain?: string): string {
  return [
    `${name}=`,
    'Path=/',
    'Max-Age=0',
    ...(domain ? [`Domain=${domain}`] : []),
    ...(secure ? ['Secure'] : []),
    'HttpOnly',
    'SameSite=Strict',
  ].join('; ');
}

export function POST(request: NextRequest) {
  return runtime.runPromise(
    Effect.gen(function* () {
      if (!(yield* fromEarn(request))) {
        return new NextResponse(null, { status: 403 });
      }
      const config = yield* AppConfig.AppConfig;
      const response = new NextResponse(null, { status: 204 });
      // Earn's own session first: it outlasts Privy's token by weeks.
      const sessions = yield* Sessions.Sessions;
      response.headers.append('Set-Cookie', sessions.endCookie);
      const { isProduction } = config;
      const domain = config.privy.cookieDomain;
      for (const name of PRIVY_COOKIES) {
        response.headers.append('Set-Cookie', expired(name, isProduction));
        if (domain) {
          response.headers.append(
            'Set-Cookie',
            expired(name, isProduction, domain),
          );
        }
      }
      return response;
    }),
  );
}
