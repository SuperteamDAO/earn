import { Image, Text, VStack } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';

import { FeedPageLayout } from '@/layouts/Feed';

import { fetchFeedPostQuery } from '../queries';
import { type FeedPostType } from '../types';
import { FeedCardContainerSkeleton } from './FeedCardContainer';
import { GrantCard } from './grantCard';
import { PowCard } from './powCard';
import { SubmissionCard } from './submissionCard';

interface Props {
  type: FeedPostType;
  id: string;
}

export const FeedPost = ({ type, id }: Props) => {
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
  return (
    <FeedPageLayout>
      {isLoading || !data ? (
        <FeedCardContainerSkeleton />
      ) : (
        <>
          {data.map((item, index) => {
            switch (item.type) {
              case 'submission':
                return (
                  <SubmissionCard
                    key={index}
                    sub={item as any}
                    type="activity"
                  />
                );
              case 'pow':
                return (
                  <PowCard key={index} pow={item as any} type="activity" />
                );
              case 'grant-application':
                return (
                  <GrantCard type="activity" grant={item as any} key={index} />
                );
              default:
                return null;
            }
          })}
        </>
      )}
    </FeedPageLayout>
  );
};
