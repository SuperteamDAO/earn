import 'server-only';

import type { ReactNode } from 'react';

import type { ChapterDisplay } from '@/interface/chapter';
import { Default } from '@/layouts/Default';
import { getViewer } from '@/lib/session';
import { cn } from '@/utils/cn';

import { BannerCarousel } from '@/features/home/components/Banner';
import { CategoryBanner } from '@/features/home/components/CategoryBanner';
import { CountryBanner } from '@/features/home/components/CountryBanner';
import { RegionBanner } from '@/features/home/components/RegionBanner';
import { HomeSideBar } from '@/features/home/components/SideBar';
import { TypeBanner } from '@/features/home/components/TypeBanner';
import { UserStatsBanner } from '@/features/home/components/UserStatsBanner';

import { homeCounts } from './home-counts';

interface CountryData {
  readonly name: string;
  readonly code: string;
}

interface CategoryData {
  readonly name: string;
  readonly slug: string;
}

interface HomeProps {
  readonly children: ReactNode;
  readonly type: 'listing' | 'region' | 'feed' | 'category';
  readonly st?: ChapterDisplay;
  readonly countryData?: CountryData;
  readonly categoryData?: CategoryData;
  readonly listingType?: 'bounties';
  // On /earn/all/: its `?category=`, which picks a category banner.
  readonly allCategory?: string;
  // Ignored: pages export `metadata`, and the viewer is known here.
  readonly potentialSession?: boolean;
  readonly meta?: ReactNode;
}

type CategoryTypes = 'content' | 'development' | 'design' | 'other' | 'all';

const CATEGORY_TYPES: ReadonlyArray<CategoryTypes> = [
  'content',
  'development',
  'design',
  'other',
  'all',
];

const asCategoryType = (value: string): CategoryTypes | null =>
  CATEGORY_TYPES.find((type) => type === value) ?? null;

// The list pages' frame: a banner for the region, category or type, the
// page's lists with the welcome banner above, and the sidebar.
export async function Home({
  children,
  type,
  st,
  countryData,
  categoryData,
  listingType,
  allCategory,
}: HomeProps) {
  const viewer = await getViewer();

  const currentCategory = ((): CategoryTypes | null => {
    if (allCategory === undefined) return null;
    const param = allCategory.toLowerCase();
    if (!param || param === 'all' || param === 'for you') return 'all';
    const category = asCategoryType(param);
    return category === 'all' ? null : category;
  })();

  const showWelcome = !currentCategory && type === 'listing' && !listingType;
  const counts = showWelcome && !viewer ? await homeCounts() : null;

  return (
    <Default className="bg-white">
      {type === 'region' && st && <RegionBanner st={st} />}
      {type === 'region' && countryData && !st && (
        <CountryBanner
          countryName={countryData.name}
          countryCode={countryData.code}
        />
      )}
      {type === 'category' && categoryData && (
        <CategoryBanner
          category={asCategoryType(categoryData.name.toLowerCase()) ?? 'all'}
        />
      )}
      {type === 'listing' && listingType && <TypeBanner type={listingType} />}
      {!!currentCategory && type !== 'region' && type !== 'category' && (
        <CategoryBanner category={currentCategory} />
      )}
      <div className={cn('mx-auto w-full px-2 lg:px-6')}>
        <div className="mx-auto w-full max-w-7xl p-0">
          <div className="flex items-start justify-between">
            <div className="w-full min-w-0 lg:border-r lg:border-slate-100">
              <div className="w-full lg:pr-6">
                {showWelcome && (
                  <div className="pt-3">
                    {viewer ? (
                      <UserStatsBanner />
                    ) : (
                      <BannerCarousel
                        totalUsers={counts?.totalUsers}
                        totalSponsors={counts?.totalSponsors}
                      />
                    )}
                  </div>
                )}
                {children}
              </div>
            </div>
            <div className="hidden lg:flex">
              <HomeSideBar type={type} />
            </div>
          </div>
        </div>
      </div>
    </Default>
  );
}
