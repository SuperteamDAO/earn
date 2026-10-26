import * as Effect from 'effect/Effect';
import { NextResponse, type NextRequest } from 'next/server';

import { json, readBody } from '@/lib/route-guard';
import * as EmailPreferences from '@/server/email-preferences';
import { runtime } from '@/server/runtime';

// The link in every email earn-emails sends:
// /api/email/unsubscribe?email=…&signature=… (HMAC of the address with the
// unsubscribe secret). A GET acts, because it's a link in an email; the
// signature is what authorizes it.
const unsubscribe = (
  email: string | null,
  signature: string | null,
  link: boolean,
) =>
  runtime.runPromise(
    Effect.gen(function* () {
      if (!email || !signature) {
        return json(400, { message: 'Missing required parameters' });
      }
      return yield* EmailPreferences.EmailPreferences.use((preferences) =>
        preferences.unsubscribe(email, signature),
      ).pipe(
        Effect.map((unsubscribed) => {
          if (!unsubscribed)
            return json(200, { message: 'Already unsubscribed' });
          return link
            ? new NextResponse(
                '<h1>You have been successfully unsubscribed</h1>',
                { headers: { 'Content-Type': 'text/html; charset=utf-8' } },
              )
            : json(200, { message: 'Successfully unsubscribed' });
        }),
        Effect.catchTags({
          BadSignature: () =>
            Effect.succeed(json(403, { message: 'Invalid signature' })),
          NotConfigured: () =>
            Effect.succeed(json(500, { message: 'Internal server error' })),
          DatabaseError: () =>
            Effect.succeed(json(500, { message: 'Internal server error' })),
        }),
      );
    }),
  );

export function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  return unsubscribe(
    searchParams.get('email'),
    searchParams.get('signature'),
    true,
  );
}

// A JSON or form body, falling back to the query, as Earn read it.
export async function POST(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const text = (await runtime.runPromise(readBody(request, 4096))) ?? '';
  let body: Record<string, unknown> = {};
  try {
    const parsed: unknown = JSON.parse(text);
    if (typeof parsed === 'object' && parsed !== null) body = { ...parsed };
  } catch {
    body = Object.fromEntries(new URLSearchParams(text));
  }
  const field = (name: string) => {
    const value = body[name];
    return (typeof value === 'string' && value) || searchParams.get(name);
  };
  return unsubscribe(field('email'), field('signature'), false);
}
