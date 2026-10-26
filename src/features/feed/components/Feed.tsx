'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { ExternalImage } from '@/components/ui/cloudinary-image';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/utils/cn';

import { HomepagePop } from '@/features/conversion-popups/components/HomepagePop';
import { VibeCard } from '@/features/home/components/VibeCard';

import {
  DEFAULT_TIME_PERIOD,
  type FeedDataProps,
  type FeedPostType,
} from '../types';
import { InfiniteFeed } from './InfiniteFeed';

interface Props {
  type?: FeedPostType;
  id?: string;
  isWinner?: boolean;
  activeMenu: 'new' | 'popular';
  // The first page, for `activeMenu` and the default period.
  initial: FeedDataProps[];
}

interface MenuOptionProps {
  option: 'new' | 'popular';
  activeMenu: 'new' | 'popular';
  onSelect: (option: 'new' | 'popular') => void;
}

const MenuOption = ({ option, activeMenu, onSelect }: MenuOptionProps) => {
  return (
    <button
      type="button"
      aria-pressed={activeMenu === option}
      className={cn(
        'flex cursor-pointer items-center border-b-2 text-sm font-medium capitalize transition-colors lg:text-base',
        activeMenu === option
          ? 'border-brand-purple/80 text-slate-900'
          : 'border-transparent text-slate-500 hover:text-slate-700',
      )}
      onClick={() => onSelect(option)}
    >
      {option}
    </button>
  );
};

// The feed's body; pages put it in `FeedPageLayout isHomePage` (a server
// layout).
export const Feed = ({
  isWinner = false,
  id,
  type,
  activeMenu,
  initial,
}: Props) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [timePeriod, setTimePeriod] = useState(DEFAULT_TIME_PERIOD);

  const handleMenuSelect = (option: 'new' | 'popular') => {
    const params = new URLSearchParams(searchParams?.toString());
    params.set('filter', option);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const query = {
    filter: activeMenu,
    timePeriod: activeMenu === 'popular' ? timePeriod.toLowerCase() : undefined,
    isWinner,
    take: 15,
    highlightId: id,
    highlightType: type,
  };

  return (
    <>
      <HomepagePop />
      <div className="border-b border-slate-200 px-5 pt-6">
        <h1 className="text-lg font-semibold text-slate-900 lg:text-xl">
          Activity Feed
        </h1>
        <p className="mt-1 text-sm text-slate-500 lg:text-base">
          Discover the best work on Earn
        </p>
        <div className="flex w-full pt-4 lg:hidden">
          <VibeCard />
        </div>
        <div className="mt-4 -mb-px flex h-12 items-stretch justify-between gap-4">
          <div className="flex shrink-0 gap-5">
            <MenuOption
              option="new"
              activeMenu={activeMenu}
              onSelect={handleMenuSelect}
            />
            <MenuOption
              option="popular"
              activeMenu={activeMenu}
              onSelect={handleMenuSelect}
            />
          </div>

          {activeMenu === 'popular' && (
            <Select value={timePeriod} onValueChange={setTimePeriod}>
              <SelectTrigger
                aria-label="Activity time period"
                className="h-8 w-32 shrink-0 self-center text-xs text-slate-500"
              >
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
      <div className="min-w-0">
        <InfiniteFeed
          key={`${activeMenu}:${timePeriod}`}
          initial={
            activeMenu === 'new' || timePeriod === DEFAULT_TIME_PERIOD
              ? initial
              : undefined
          }
          query={query}
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
        </InfiniteFeed>
      </div>
    </>
  );
};
