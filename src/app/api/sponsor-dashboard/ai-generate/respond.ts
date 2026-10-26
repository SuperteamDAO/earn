import 'server-only';

import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import { NextResponse, type NextRequest } from 'next/server';

import { decodeBody, guardSponsor, json } from '@/lib/route-guard';
import * as ListingAi from '@/server/listing-ai';
import type * as RateLimits from '@/server/rate-limits';
import type { SponsorWriter } from '@/server/users';

export const Description = Schema.String.check(Schema.isMinLength(1));
export const ListingType = Schema.Literals(['bounty', 'hackathon']);

const rateLimited = (error: RateLimits.RateLimited) =>
  Effect.succeed(
    NextResponse.json(
      {
        message: 'Too many requests. Please wait before trying again.',
        retryAfter: error.retryAfterSeconds,
      },
      {
        status: 429,
        headers: { 'Retry-After': String(error.retryAfterSeconds) },
      },
    ),
  );

// An AI route: a sponsor's request, its body, one ListingAi call; Earn's
// answers for a refused body, the rate limit and a failed generation.
export const aiRoute =
  <A, I, B>(
    schema: Schema.Codec<A, I>,
    failure: string,
    generate: (
      ai: ListingAi.ListingAi['Service'],
      sponsor: SponsorWriter,
      body: A,
    ) => Effect.Effect<
      B,
      | RateLimits.RateLimited
      | ListingAi.AiFailed
      | { readonly _tag: 'DatabaseError' }
    >,
  ) =>
  (request: NextRequest) =>
    Effect.gen(function* () {
      const sponsor = yield* guardSponsor(request);
      if (sponsor instanceof NextResponse) return sponsor;
      const body = yield* decodeBody(request, schema);
      if (body instanceof NextResponse) {
        return body.status === 400
          ? json(400, { error: 'Invalid request body' })
          : body;
      }
      return yield* ListingAi.ListingAi.use((ai) =>
        generate(ai, sponsor, body),
      ).pipe(
        Effect.map((result) =>
          result instanceof Response ? result : json(200, result),
        ),
        Effect.catchTag('RateLimited', rateLimited),
        Effect.orElseSucceed(() => json(500, { error: failure })),
      );
    });
