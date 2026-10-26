import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import { NextResponse, type NextRequest } from 'next/server';

import { decodeBody, guardUser, json } from '@/lib/route-guard';
import * as GrantApplications from '@/server/grant-applications';
import { trancheResponse } from '@/server/grant-responses';
import { runtime } from '@/server/runtime';

const Body = Schema.Struct({
  applicationId: Schema.optional(Schema.String),
  walletAddress: Schema.optional(Schema.String),
  helpWanted: Schema.optional(Schema.Unknown),
  projectUpdate: Schema.optional(Schema.Unknown),
  eventPictures: Schema.optional(Schema.Unknown),
  eventReceipts: Schema.optional(Schema.Unknown),
  attendeeCount: Schema.optional(Schema.Unknown),
  socialPost: Schema.optional(Schema.Unknown),
  colosseumLink: Schema.optional(Schema.Unknown),
  githubRepo: Schema.optional(Schema.Unknown),
  aiReceipt: Schema.optional(Schema.Unknown),
  aiReceipts: Schema.optional(Schema.Unknown),
});

// Asks for the grant's next tranche.
export function POST(request: NextRequest) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const writer = yield* guardUser(request);
      if (writer instanceof NextResponse) return writer;
      const body = yield* decodeBody(request, Body);
      if (body instanceof NextResponse) return body;
      const { applicationId, walletAddress } = body;
      if (!applicationId) {
        return json(400, { message: 'Application ID is required' });
      }
      if (!walletAddress) {
        return json(400, { message: 'Wallet address is required' });
      }
      return yield* trancheResponse(
        GrantApplications.GrantApplications.use((applications) =>
          applications.requestTranche(writer.userId, {
            ...body,
            applicationId,
            walletAddress,
          }),
        ),
        applicationId,
      );
    }),
  );
}
