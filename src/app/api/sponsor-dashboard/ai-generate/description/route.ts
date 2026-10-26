import type { UIMessage } from 'ai';
import * as Schema from 'effect/Schema';
import type { NextRequest } from 'next/server';

import { runtime } from '@/server/runtime';

import { aiRoute, ListingType } from '../respond';

const Body = Schema.Struct({
  messages: Schema.Array(Schema.Unknown),
  listingType: ListingType,
  token: Schema.optional(Schema.String),
  tokenUsdAmount: Schema.optional(Schema.Finite),
  hackathonName: Schema.optional(Schema.String),
});

// Streams the description; the sponsor's details come from Earn, not the
// body.
const handle = aiRoute(
  Body,
  'Failed to generate description',
  (ai, sponsor, body) =>
    ai.description(sponsor.userId, sponsor.sponsorId, {
      ...body,
      // The AI SDK's chat messages, as useChat sent them.
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion
      messages: body.messages as ReadonlyArray<UIMessage>,
    }),
);

export function POST(request: NextRequest) {
  return runtime.runPromise(handle(request));
}
