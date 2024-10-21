import { type GetServerSideProps } from 'next';
import { z } from 'zod';

import {
  FeedPost,
  type FeedPostType,
  FeedPostTypeSchema,
} from '@/features/feed';

interface Props {
  type: FeedPostType;
  id: string;
}

export default function FeedPostPage({ type, id }: Props) {
  return <FeedPost type={type} id={id} />;
}

const UUIDSchema = z.string().uuid();
export const getServerSideProps: GetServerSideProps = async (context) => {
  const { params } = context;

  const type = params?.type;
  const id = params?.id;

  if (typeof type !== 'string' || !FeedPostTypeSchema.safeParse(type).success) {
    return {
      notFound: true,
    };
  }

  if (typeof id !== 'string' || !UUIDSchema.safeParse(id).success) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      type,
      id,
    },
  };
};
