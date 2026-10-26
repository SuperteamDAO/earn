import { ASSET_URL } from '@/constants/ASSET_URL';
import { FeedPageLayout } from '@/layouts/Feed';
import { pageMetadata } from '@/lib/metadata';

import { Feed } from '@/features/feed/components/Feed';
import { isFeedPostId, parseFeedPostType } from '@/features/feed/types';

import { activeMenuOf, firstFeedPage } from './feed-page';

export const metadata = pageMetadata({
  title: 'Activity Feed | Superteam Earn',
  description:
    'Discover the best work on Earn. Browse popular submissions, recent activity, and winning entries from the Superteam community.',
  canonical: 'https://superteam.fun/earn/feed/',
  og: `${ASSET_URL}/og/og.png`,
  noIndex: true,
});

const one = (value: string | string[] | undefined) =>
  typeof value === 'string' ? value : undefined;

export default async function FeedPage({
  searchParams,
}: PageProps<'/earn/feed'>) {
  const query = await searchParams;
  const type = parseFeedPostType(one(query.type));
  const rawId = one(query.id);
  const id = isFeedPostId(rawId) ? rawId : undefined;
  const activeMenu = activeMenuOf(query.filter);
  const initial = await firstFeedPage({
    activeMenu,
    isWinner: false,
    highlightId: id,
    highlightType: type,
  });
  return (
    <FeedPageLayout isHomePage>
      <Feed id={id} type={type} activeMenu={activeMenu} initial={initial} />
    </FeedPageLayout>
  );
}
