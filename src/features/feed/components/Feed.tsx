import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { useInView } from 'react-intersection-observer';

import { ExternalImage } from '@/components/ui/cloudinary-image';
import { HomepagePop } from '@/features/conversion-popups/components/HomepagePop';
import { VibeCard } from '@/features/home/components/VibeCard';
import { FeedPageLayout } from '@/layouts/Feed';
import { cn } from '@/utils/cn';

import { useGetFeed } from '../queries/useGetFeed';
import { type FeedPostType } from '../types';
import { FeedLoop } from './FeedLoop';

interface Props {
  type?: FeedPostType;
  id?: string;
  isWinner?: boolean;
}

export const Feed = ({ isWinner = false, id, type }: Props) => {
  const router = useRouter();
  const { query } = router;

  const [activeMenu, setActiveMenu] = useState<'new' | 'popular'>(
    (query.filter as 'new' | 'popular') || 'popular',
  );
  const [timePeriod, setTimePeriod] = useState('This Month');

  const { ref, inView } = useInView();

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useGetFeed({
      filter: activeMenu,
      timePeriod:
        activeMenu === 'popular' ? timePeriod.toLowerCase() : undefined,
      isWinner,
      take: 15,
      highlightId: id,
      highlightType: type,
    });

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage, hasNextPage]);

  useEffect(() => {
    if (query.filter && query.filter !== activeMenu) {
      setActiveMenu(query.filter as 'new' | 'popular');
    }
  }, [query]);

  const updateQuery = (key: string, value: string) => {
    router.push(
      {
        pathname: router.pathname,
        query: { ...query, [key]: value },
      },
      undefined,
      { shallow: true },
    );
  };

  const MenuOption = ({ option }: { option: 'new' | 'popular' }) => {
    return (
      <button
        className={cn(
          'cursor-pointer capitalize',
          'text-sm lg:text-base',
          activeMenu === option
            ? 'font-semibold text-slate-700'
            : 'font-normal text-slate-500',
        )}
        onClick={() => {
          setActiveMenu(option);
          updateQuery('filter', option);
        }}
      >
        {option}
      </button>
    );
  };

  const feedItems = data?.pages.flatMap((page) => page) ?? [];

  return (
    <FeedPageLayout isHomePage>
      <HomepagePop />
      <div className="border-b py-5 pl-6 pr-2 md:pl-5">
        <p className="text-lg font-medium text-slate-900 lg:text-xl">
          Activity Feed
        </p>
        <p className="text-base text-slate-500">
          Discover the best work on Earn
        </p>
        <div className="flex w-full pt-4 lg:hidden">
          <VibeCard />
        </div>
        <div className="mt-4 flex w-full items-center justify-between">
          <div className="mr-3 flex gap-3">
            <MenuOption option="new" />
            <MenuOption option="popular" />
          </div>

          {activeMenu === 'popular' && (
            <select
              className="mr-1 w-28 text-right text-sm text-slate-500"
              onChange={(e) => {
                setTimePeriod(e.target.value);
              }}
              value={timePeriod}
            >
              <option>This Week</option>
              <option>This Month</option>
              <option>This Year</option>
            </select>
          )}
        </div>
      </div>
      <div className="pl-1 md:pl-0">
        <FeedLoop
          feed={feedItems}
          ref={ref}
          isFetchingNextPage={isFetchingNextPage}
          isLoading={isLoading}
          type="activity"
        >
          <div className="my-32">
            <ExternalImage
              className="mx-auto w-32"
              src={'/bg/talent-empty.svg'}
              alt="talent empty"
            />
            <p className="mx-auto mt-5 w-[200px] text-center text-base font-medium text-slate-500 md:text-lg">
              No Activity Found
            </p>
            <p className="mx-auto mt-1 text-center text-sm text-slate-400 md:text-base">
              We couldn’t find any activity for your time filter
            </p>
          </div>
        </FeedLoop>
      </div>
    </FeedPageLayout>
  );
};
