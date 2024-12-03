import { useQuery } from '@tanstack/react-query';

import { ASSET_URL } from '@/constants/ASSET_URL';
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
        <div className="mt-20 flex min-h-[100vh] flex-col items-center justify-start gap-4">
          <img alt="404 page" src={ASSET_URL + '/bg/404.svg'} />
          <p className="text-xl font-medium">No post found</p>
          <p className="max-w-2xl text-center text-base text-gray-500 lg:text-lg">
            Sorry, we couldn&apos;t find what you were looking for. It’s
            probably your own fault, please check your spelling or meanwhile
            have a look at this cat
          </p>
          <img
            className="w-[20rem] lg:w-[30rem]"
            alt="cat image"
            src={ASSET_URL + '/bg/cat.png'}
          />
        </div>
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
