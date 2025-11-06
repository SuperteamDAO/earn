import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { useInView } from 'react-intersection-observer';

import { ExternalImage } from '@/components/ui/cloudinary-image';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FeedPageLayout } from '@/layouts/Feed';
import { cn } from '@/utils/cn';

import { HomepagePop } from '@/features/conversion-popups/components/HomepagePop';
import { VibeCard } from '@/features/home/components/VibeCard';

import { useGetFeed } from '../queries/useGetFeed';
import { type FeedPostType } from '../types';
import { FeedLoop } from './FeedLoop';

interface Props {
  type?: FeedPostType;
  id?: string;
  isWinner?: boolean;
  meta?: React.ReactNode;
}

export const Feed = ({ isWinner = false, id, type, meta }: Props) => {
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
    <FeedPageLayout isHomePage meta={meta}>
      <HomepagePop />
      <div className="border-b py-5 pr-2 pl-6 md:pl-5">
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
            <Select value={timePeriod} onValueChange={setTimePeriod}>
              <SelectTrigger className="mr-1 h-6 w-28 text-right text-xs text-slate-500 sm:h-8">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent className="text-slate-500">
                <SelectItem className="text-xs" value="This Week">
                  This Week
                </SelectItem>
                <SelectItem className="text-xs" value="This Month">
                  This Month
                </SelectItem>
                <SelectItem className="text-xs" value="This Year">
                  This Year
                </SelectItem>
              </SelectContent>
            </Select>
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
