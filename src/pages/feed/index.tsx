import { type GetServerSideProps } from 'next';
import { z } from 'zod';

import { Feed, type FeedPostType, FeedPostTypeSchema } from '@/features/feed';

interface Props {
  type?: FeedPostType | null;
  id?: string | null;
}

export default function FeedPage({ id, type }: Props) {
  return <Feed id={id || undefined} type={type || undefined} />;
}

const UUIDSchema = z.string().uuid();
export const getServerSideProps: GetServerSideProps = async (context) => {
  const { query } = context;

  let type = query?.type || null;
  let id = query?.id || null;

  if (typeof type !== 'string' || !FeedPostTypeSchema.safeParse(type).success) {
    type = null;
  }

  if (typeof id !== 'string' || !UUIDSchema.safeParse(id).success) {
    id = null;
  }

  return {
    props: {
      type,
      id,
    },
  };
};
