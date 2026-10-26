import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import { NextResponse, type NextRequest } from 'next/server';

import { decodeBody, guardSponsor, json } from '@/lib/route-guard';
import { SubmissionLabels } from '@/prisma/enums';
import * as Review from '@/server/review';
import { runtime } from '@/server/runtime';

import { refusal } from '../refusal';

const Id = Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(191));

// One submission (`id`) or several (`ids`, for Spam and Shortlisted).
const Body = Schema.Struct({
  id: Schema.optional(Id),
  ids: Schema.optional(Schema.Array(Id).check(Schema.isMaxLength(500))),
  label: Schema.Literals(Object.values(SubmissionLabels)),
});

// Labels submissions; Spam also costs each entrant a credit.
export function POST(request: NextRequest) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const writer = yield* guardSponsor(request);
      if (writer instanceof NextResponse) return writer;
      const body = yield* decodeBody(request, Body);
      if (body instanceof NextResponse) return body;
      const ids = body.ids ?? (body.id ? [body.id] : []);
      return yield* Review.Review.use((review) =>
        review.updateLabel(writer, ids, body.label),
      ).pipe(
        Effect.map((result) => json(200, result)),
        Effect.catch((error) => Effect.succeed(refusal(error))),
      );
    }),
  );
}
