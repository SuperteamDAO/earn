import { notFound } from 'next/navigation';
import { z } from 'zod';

import { FeedPost } from '@/features/feed/components/FeedPost';
import { type FeedPostType, FeedPostTypeSchema } from '@/features/feed/types';

interface RouteParams {
  type: string;
  id: string;
}

interface Props {
  params: Promise<RouteParams>;
}

const UUIDSchema = z.string().uuid();

export default async function FeedPostPage({ params }: Props) {
  const { type, id } = await params;

  if (typeof type !== 'string' || !FeedPostTypeSchema.safeParse(type).success) {
    notFound();
  }

  if (typeof id !== 'string' || !UUIDSchema.safeParse(id).success) {
    notFound();
  }

  return <FeedPost type={type as FeedPostType} id={id} />;
}
