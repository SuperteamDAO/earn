import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import { NextResponse, type NextRequest } from 'next/server';

import { decodeBody, guardUser, json, readerUser } from '@/lib/route-guard';
import { runtime } from '@/server/runtime';
import * as SponsorSwitch from '@/server/sponsor-switch';

const database = () => Effect.succeed(json(500, { error: 'database' }));

// The hackathon switcher's options.
export function GET(request: NextRequest) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const writer = yield* readerUser(request);
      if (writer instanceof NextResponse) return writer;
      const search = (
        request.nextUrl.searchParams.get('searchString') ?? ''
      ).slice(0, 100);
      return yield* SponsorSwitch.SponsorSwitch.use((service) =>
        service.hackathons(writer.userId, search),
      ).pipe(
        Effect.map((options) => json(200, options)),
        Effect.catchTag('DatabaseError', database),
      );
    }),
  );
}

const Body = Schema.Struct({
  hackathonId: Schema.String.check(Schema.isMaxLength(191)),
});

// Switches God mode to a hackathon (`hackathonId`).
export function POST(request: NextRequest) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const writer = yield* guardUser(request);
      if (writer instanceof NextResponse) return writer;
      const body = yield* decodeBody(request, Body, 1024);
      if (body instanceof NextResponse) return body;
      return yield* SponsorSwitch.SponsorSwitch.use((service) =>
        service.switchHackathon(writer.userId, body.hackathonId),
      ).pipe(
        Effect.as(json(200, { ok: true })),
        Effect.catchTags({
          SwitchRefused: () => Effect.succeed(json(403, { error: 'refused' })),
          DatabaseError: database,
        }),
      );
    }),
  );
}
