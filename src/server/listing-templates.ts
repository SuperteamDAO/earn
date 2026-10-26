import 'server-only';

import * as Clock from 'effect/Clock';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import type { Prisma } from '@/prisma/client';
import type { BountyType } from '@/prisma/enums';
import * as Database from '@/server/database';

import type { BuilderTemplate } from '@/features/listing-builder/types/builder';

const TEMPLATE = {
  id: true,
  title: true,
  description: true,
  skills: true,
  rewards: true,
  rewardAmount: true,
  minRewardAsk: true,
  maxRewardAsk: true,
  maxBonusSpots: true,
  emoji: true,
  compensationType: true,
  type: true,
  token: true,
  color: true,
  language: true,
  region: true,
  slug: true,
  Bounties: {
    distinct: ['sponsorId'],
    take: 3,
    orderBy: { createdAt: 'desc' },
    select: { sponsor: { select: { name: true, logo: true } } },
    where: {
      isPublished: true,
      status: 'OPEN',
      isPrivate: false,
      isActive: true,
    },
  },
} as const satisfies Prisma.BountiesTemplatesSelect;

// A template's public page (/earn/templates/listings/[slug]/), as Earn's
// listing page shows it.
const TEMPLATE_DETAILS = {
  id: true,
  title: true,
  deadline: true,
  slug: true,
  description: true,
  skills: true,
  type: true,
  requirements: true,
  region: true,
  status: true,
  token: true,
  references: true,
  referredBy: true,
  publishedAt: true,
  compensationType: true,
  maxRewardAsk: true,
  minRewardAsk: true,
  language: true,
  rewardAmount: true,
  rewards: true,
  maxBonusSpots: true,
  usdValue: true,
  sponsorId: true,
  pocId: true,
  pocSocials: true,
  source: true,
  isPublished: true,
  sponsor: {
    select: {
      name: true,
      logo: true,
      slug: true,
      url: true,
      entityName: true,
      isVerified: true,
      isCaution: true,
    },
  },
  poc: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      username: true,
      photo: true,
    },
  },
} as const satisfies Prisma.BountiesTemplatesSelect;

export type TemplateDetails = Prisma.BountiesTemplatesGetPayload<{
  select: typeof TEMPLATE_DETAILS;
}>;

const DAY = 86_400_000;

export class ListingTemplates extends Context.Service<
  ListingTemplates,
  {
    // Up to 20 active templates of a type (hackathon tracks have none).
    readonly list: (
      type: BountyType | null,
    ) => Effect.Effect<ReadonlyArray<BuilderTemplate>, Database.DatabaseError>;
    // One template, its deadline six days from now; null when there's none.
    readonly details: (
      slug: string,
    ) => Effect.Effect<TemplateDetails | null, Database.DatabaseError>;
  }
>()('earn/ListingTemplates') {}

const make = Effect.gen(function* () {
  const database = yield* Database.Database;

  const list = Effect.fn('ListingTemplates.list')(function* (
    type: BountyType | null,
  ) {
    const rows = yield* database.query('listingTemplates', (client) =>
      client.bountiesTemplates.findMany({
        where: { isActive: true, isArchived: false, type: type ?? undefined },
        take: 20,
        select: TEMPLATE,
      }),
    );
    // Json columns hold what Earn's template forms wrote.
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    return rows as unknown as ReadonlyArray<BuilderTemplate>;
  });

  const details = Effect.fn('ListingTemplates.details')(function* (
    slug: string,
  ) {
    const row = yield* database.query('listingTemplate', (client) =>
      client.bountiesTemplates.findFirst({
        where: { slug, isActive: true },
        select: TEMPLATE_DETAILS,
      }),
    );
    if (!row) return null;
    const now = yield* Clock.currentTimeMillis;
    return { ...row, deadline: new Date(now + 6 * DAY) };
  });

  return ListingTemplates.of({ list, details });
});

export const layer = Layer.effect(ListingTemplates, make);
