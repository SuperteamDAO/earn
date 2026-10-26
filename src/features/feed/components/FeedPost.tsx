import { ExternalImage } from '@/components/ui/cloudinary-image';
import { FeedPageLayout } from '@/layouts/Feed';

import type { FeedDataProps } from '../types';
import { FeedPostCards } from './FeedPostCards';

interface Props {
  // The post and, for a submission, the others on its listing; null when
  // there's no such post. Loaded with the page.
  data: FeedDataProps[] | null;
}

export const FeedPost = ({ data }: Props) => {
  if (!data) {
    return (
      <FeedPageLayout>
        <div className="mt-20 flex min-h-[100vh] flex-col items-center justify-start gap-4">
          <ExternalImage alt="404 page" src={'/bg/404.svg'} />
          <p className="text-xl font-medium">No post found</p>
          <p className="max-w-2xl text-center text-base text-gray-500 lg:text-lg">
            Sorry, we couldn&apos;t find what you were looking for. It’s
            probably your own fault, please check your spelling or meanwhile
            have a look at this cat
          </p>
          <ExternalImage
            className="w-[20rem] lg:w-[30rem]"
            alt="cat image"
            src={'/bg/cat.png'}
          />
        </div>
      </FeedPageLayout>
    );
  }
  return (
    <FeedPageLayout>
      <FeedPostCards data={data} />
    </FeedPageLayout>
  );
};
