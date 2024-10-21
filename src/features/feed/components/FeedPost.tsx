import { Box, Image, Text, VStack } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { Comments } from '@/features/comments';
import { FeedPageLayout } from '@/layouts/Feed';

import { fetchFeedPostQuery } from '../queries';
import { type FeedPostType } from '../types';
import { convertFeedPostTypeToCommentRefType } from '../utils';
import { FeedCardContainerSkeleton } from './FeedCardContainer';
import { GrantCard } from './grantCard';
import { PowCard } from './powCard';
import { SubmissionCard } from './submissionCard';

interface Props {
  type: FeedPostType;
  id: string;
}

const CardComponents: Record<
  FeedPostType,
  (data: any, commentCount: number) => JSX.Element
> = {
  submission: (data, commentCount) => (
    <SubmissionCard sub={data} type="activity" commentCount={commentCount} />
  ),
  pow: (data, commentCount) => (
    <PowCard pow={data as any} type="activity" commentCount={commentCount} />
  ),
  'grant-application': (data, commentCount) => (
    <GrantCard
      grant={data as any}
      type="activity"
      commentCount={commentCount}
    />
  ),
};

export const FeedPost = ({ type, id }: Props) => {
  const [commentCount, setCommentCount] = useState(0);

  const { data, isLoading } = useQuery(
    fetchFeedPostQuery({
      type,
      id,
    }),
  );

  if (!data && !isLoading) {
    return (
      <FeedPageLayout>
        <VStack
          align={'center'}
          justify={'start'}
          gap={4}
          minH={'100vh'}
          mt={20}
        >
          <Image alt="404 page" src="/assets/bg/404.svg" />
          <Text color="black" fontSize={'xl'} fontWeight={500}>
            No post found
          </Text>
          <Text
            maxW={'2xl'}
            color="gray.500"
            fontSize={['md', 'md', 'lg', 'lg']}
            fontWeight={400}
            textAlign={'center'}
          >
            Sorry, we couldn&apos;t find what you were looking for. It’s
            probably your own fault, please check your spelling or meanwhile
            have a look at this cat
          </Text>
          <Image
            w={['20rem', '20rem', '30rem', '30rem']}
            alt="cat image"
            src="/assets/bg/cat.svg"
          />
        </VStack>
      </FeedPageLayout>
    );
  }
  const CardComponent = CardComponents[type];

  return (
    <FeedPageLayout>
      {isLoading || !data ? (
        <FeedCardContainerSkeleton />
      ) : (
        <>
          {CardComponent ? CardComponent(data, commentCount) : null}
          <Box px={6}>
            {!!data.id && (
              <Comments
                isAnnounced={false}
                listingSlug={''}
                listingType={''}
                poc={undefined}
                sponsorId={undefined}
                isVerified={false}
                refId={id}
                refType={convertFeedPostTypeToCommentRefType(type)}
                count={commentCount}
                setCount={setCommentCount}
              />
            )}
          </Box>
        </>
      )}
    </FeedPageLayout>
  );
};
