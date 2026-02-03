import { type GetServerSideProps } from 'next';
import { z } from 'zod';

import { ASSET_URL } from '@/constants/ASSET_URL';
import { Meta } from '@/layouts/Meta';

import { Feed } from '@/features/feed/components/Feed';
import { type FeedPostType, FeedPostTypeSchema } from '@/features/feed/types';

interface Props {
  type?: FeedPostType | null;
  id?: string | null;
}

export default function FeedPage({ id, type }: Props) {
  return (
    <Feed
      id={id || undefined}
      type={type || undefined}
      meta={
        <Meta
          title="Activity Feed | Superteam Earn"
          description="Discover the best work on Earn. Browse popular submissions, recent activity, and winning entries from the Superteam community."
          canonical="https://superteam.fun/earn/feed/"
          og={ASSET_URL + `/og/og.png`}
        />
      }
    />
  );
}

const UUIDSchema = z.uuid();
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
