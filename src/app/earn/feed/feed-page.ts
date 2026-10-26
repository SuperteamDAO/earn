import 'server-only';

import * as Effect from 'effect/Effect';

import { pageMetadata } from '@/lib/metadata';
import { getSession } from '@/lib/session';
import { runtime } from '@/server/runtime';
import * as TalentFeed from '@/server/talent-feed';

import { DEFAULT_TIME_PERIOD, type FeedPostType } from '@/features/feed/types';

// What Earn's Home layout put in <head> for feed pages without their own.
export const homeMetadata = pageMetadata({
  title: 'Superteam Earn | Work to Earn in Crypto',
  description:
    'Explore the latest bounties on Superteam Earn, offering opportunities in the crypto space across Design, Development, and Content.',
  canonical: 'https://superteam.fun/earn',
});

export const activeMenuOf = (filter: string | string[] | undefined) =>
  filter === 'new' ? ('new' as const) : ('popular' as const);

// The feed's first page, as the Feed component would have asked for it.
export async function firstFeedPage(options: {
  activeMenu: 'new' | 'popular';
  isWinner: boolean;
  highlightId?: string;
  highlightType?: FeedPostType;
}) {
  const session = await getSession();
  return runtime.runPromise(
    TalentFeed.TalentFeed.use((feed) =>
      feed.list(
        {
          filter: options.activeMenu,
          timePeriod:
            options.activeMenu === 'popular'
              ? DEFAULT_TIME_PERIOD.toLowerCase()
              : undefined,
          isWinner: options.isWinner,
          take: 15,
          skip: 0,
          highlightId: options.highlightId,
          highlightType: options.highlightType,
        },
        session?.userId ?? null,
      ),
    ).pipe(Effect.map((items) => [...items])),
  );
}
