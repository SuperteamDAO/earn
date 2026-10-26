import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import { NextResponse, type NextRequest } from 'next/server';

import { decodeBody, guardSponsor, json } from '@/lib/route-guard';
import { reviewResponse } from '@/server/grant-responses';
import * as GrantReview from '@/server/grant-review';
import { runtime } from '@/server/runtime';

const Body = Schema.Struct({ id: Schema.optional(Schema.Unknown) });

// Marks an approved application completed (Earn's PUT).
export function PUT(request: NextRequest) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const sponsor = yield* guardSponsor(request);
      if (sponsor instanceof NextResponse) return sponsor;
      const body = yield* decodeBody(request, Body);
      if (body instanceof NextResponse) return body;
      const { id } = body;
      if (!id || typeof id !== 'string') {
        return json(400, { error: 'ID is required and must be a string' });
      }
      return yield* reviewResponse(
        GrantReview.GrantReview.use((review) => review.complete(sponsor, id)),
      );
    }),
  );
}
