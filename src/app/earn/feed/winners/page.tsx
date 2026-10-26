import { FeedPageLayout } from '@/layouts/Feed';

import { Feed } from '@/features/feed/components/Feed';

import { activeMenuOf, firstFeedPage, homeMetadata } from '../feed-page';

export const metadata = homeMetadata;

export default async function FeedWinnersPage({
  searchParams,
}: PageProps<'/earn/feed/winners'>) {
  const activeMenu = activeMenuOf((await searchParams).filter);
  const initial = await firstFeedPage({ activeMenu, isWinner: true });
  return (
    <FeedPageLayout isHomePage>
      <Feed isWinner activeMenu={activeMenu} initial={initial} />
    </FeedPageLayout>
  );
}
