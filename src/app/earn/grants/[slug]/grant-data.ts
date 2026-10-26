import 'server-only';

import * as Effect from 'effect/Effect';
import type { Metadata } from 'next';
import { cache } from 'react';

import type { GrantPageData } from '@/layouts/Grants';
import { pageMetadata } from '@/lib/metadata';
import { getViewer } from '@/lib/session';
import * as AppConfig from '@/server/app-config';
import * as GrantPages from '@/server/grant-pages';
import { runtime } from '@/server/runtime';

import type { GrantWithApplicationCount } from '@/features/grants/types';
import { grantAmount } from '@/features/grants/utils/grantAmount';

// The grant by its slug: undefined when there's none, null when it couldn't
// be loaded (Earn's page then says so). Once per request.
export const grantBySlug = cache(
  (slug: string): Promise<GrantWithApplicationCount | null | undefined> =>
    runtime.runPromise(
      GrantPages.GrantPages.use((pages) => pages.bySlug(slug)).pipe(
        Effect.map((grant) => grant ?? undefined),
        Effect.catchTag('DatabaseError', () => Effect.succeed(null)),
      ),
    ),
);

// The rest of the page: their application, the chapters and live grants.
export async function grantPageData(
  grant: GrantWithApplicationCount | null,
): Promise<GrantPageData> {
  const viewer = await getViewer();
  return runtime.runPromise(
    Effect.gen(function* () {
      const pages = yield* GrantPages.GrantPages;
      const [application, chapters, liveGrants] = yield* Effect.all(
        [
          viewer && grant
            ? pages.mine(viewer.id, grant.id)
            : Effect.succeed(null),
          pages.chapters,
          grant
            ? pages.liveGrants(viewer?.location, !!viewer, grant.id)
            : Effect.succeed([] as const),
        ],
        { concurrency: 'unbounded' },
      );
      return {
        application,
        chapters: [...chapters],
        liveGrants: [...liveGrants],
      };
    }).pipe(
      Effect.catchTag('DatabaseError', () =>
        Effect.succeed({ application: null, chapters: [], liveGrants: [] }),
      ),
    ),
  );
}

const siteUrl = () =>
  runtime.runPromise(
    AppConfig.AppConfig.use((config) =>
      Effect.succeed(
        config.siteUrl.endsWith('/') ? config.siteUrl : `${config.siteUrl}/`,
      ),
    ),
  );

// Earn's grant page <Meta>: title, the funding in the description, the
// grant's own OG image.
export async function grantMetadata(
  grant: GrantWithApplicationCount | null,
): Promise<Metadata> {
  const base = await siteUrl();
  const og = `${base}api/dynamic-og/grant/?title=${encodeURIComponent(grant?.title || '')}&token=${grant?.token}&sponsor=${grant?.sponsor?.name}&logo=${grant?.sponsor?.logo}&minReward=${grant?.minReward}&maxReward=${grant?.maxReward}&isSponsorVerified=${grant?.sponsor?.isVerified}`;
  let rewardText = '';
  if (grant?.maxReward) {
    const amount = grantAmount({
      minReward: grant.minReward ?? 0,
      maxReward: grant.maxReward,
    });
    rewardText =
      grant.minReward && grant.minReward > 0
        ? `between $${amount}`
        : `up to $${amount.replace('Up to ', '')}`;
  }
  const title = `${grant?.title || 'Grant'} | Superteam Earn`;
  const metadata = pageMetadata({
    title,
    description: `${grant?.title || 'Grant'} by ${grant?.sponsor?.name}${rewardText ? ` | Apply for funding ${rewardText}` : ''} in ${grant?.token} on Superteam Earn`,
    canonical: grant?.slug
      ? `https://superteam.fun/earn/grants/${grant.slug}/`
      : undefined,
    og,
  });
  return {
    ...metadata,
    openGraph: {
      ...metadata.openGraph,
      images: [
        {
          url: og,
          width: 1200,
          height: 630,
          alt: `${grant?.title || 'Grant'} - Grant by ${grant?.sponsor?.name || 'Sponsor'} on Superteam Earn`,
        },
      ],
    },
  };
}
