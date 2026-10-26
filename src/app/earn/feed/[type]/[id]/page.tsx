import { notFound } from 'next/navigation';

import { runtime } from '@/server/runtime';
import * as TalentFeed from '@/server/talent-feed';

import { FeedPost } from '@/features/feed/components/FeedPost';
import { isFeedPostId, parseFeedPostType } from '@/features/feed/types';

import { homeMetadata } from '../../feed-page';

export const metadata = homeMetadata;

export default async function FeedPostPage({
  params,
}: PageProps<'/earn/feed/[type]/[id]'>) {
  const { type: rawType, id } = await params;
  const type = parseFeedPostType(rawType);
  if (!type || !isFeedPostId(id)) notFound();
  const post = await runtime.runPromise(
    TalentFeed.TalentFeed.use((feed) => feed.post(type, id)),
  );
  return <FeedPost data={post ? [...post] : null} />;
}
