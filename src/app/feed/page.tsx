import { z } from 'zod';

import { Feed } from '@/features/feed/components/Feed';
import { type FeedPostType, FeedPostTypeSchema } from '@/features/feed/types';

interface SearchParams {
  type?: string;
  id?: string;
}

interface Props {
  searchParams: Promise<SearchParams>;
}

const UUIDSchema = z.string().uuid();

export default async function FeedPage({ searchParams }: Props) {
  const params = await searchParams;

  let type: FeedPostType | undefined = undefined;
  let id: string | undefined = undefined;

  if (
    typeof params.type === 'string' &&
    FeedPostTypeSchema.safeParse(params.type).success
  ) {
    type = params.type as FeedPostType;
  }

  if (
    typeof params.id === 'string' &&
    UUIDSchema.safeParse(params.id).success
  ) {
    id = params.id;
  }

  return <Feed id={id} type={type} />;
}
