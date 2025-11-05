import { usePrivy } from '@privy-io/react-auth';
import { useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import React, { type ReactNode, useMemo } from 'react';

import { type Superteam } from '@/constants/Superteam';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';
import { cn } from '@/utils/cn';

import { BannerCarousel } from '@/features/home/components/Banner';
import { UserStatsBanner } from '@/features/home/components/UserStatsBanner';
import { userCountQuery } from '@/features/home/queries/user-count';

interface HomeProps {
  readonly children: ReactNode;
  readonly type: 'listing' | 'region' | 'feed' | 'region-all';
  readonly st?: Superteam;
  readonly potentialSession?: boolean;
  readonly meta?: ReactNode;
}

type CategoryTypes = 'content' | 'development' | 'design' | 'other' | 'all';

const RegionBanner = dynamic(() =>
  import('@/features/home/components/RegionBanner').then(
    (mod) => mod.RegionBanner,
  ),
);

const CategoryBanner = dynamic(() =>
  import('@/features/home/components/CategoryBanner').then(
    (mod) => mod.CategoryBanner,
  ),
);

const HomeSideBar = dynamic(() =>
  import('@/features/home/components/SideBar').then((mod) => mod.HomeSideBar),
);

export function Home({
  children,
  type,
  st,
  potentialSession = false,
  meta,
}: HomeProps) {
  const router = useRouter();
  const { authenticated } = usePrivy();

  const { data: totalUsers } = useQuery(userCountQuery);

  const currentCategory = useMemo(() => {
    const categoryParam = router.query.category?.toString().toLowerCase();
    const isAllPage = router.asPath.includes('/all');

    if (isAllPage) {
      if (
        !categoryParam ||
        categoryParam === 'all' ||
        categoryParam === 'for you'
      ) {
        return 'all';
      }
      if (
        categoryParam === 'development' ||
        categoryParam === 'design' ||
        categoryParam === 'content' ||
        categoryParam === 'other'
      ) {
        return categoryParam as CategoryTypes;
      }
      return null;
    }
    return null;
  }, [router.query.category, router.asPath]);

  return (
    <Default
      className="bg-white"
      meta={
        meta || (
          <Meta
            title="Superteam Earn | Work to Earn in Crypto"
            description="Explore the latest bounties on Superteam Earn, offering opportunities in the crypto space across Design, Development, and Content."
            canonical="https://earn.superteam.fun"
          />
        )
      }
    >
      {type === 'region' && st && <RegionBanner st={st} />}
      {!!currentCategory && type !== 'region' && type !== 'region-all' && (
        <CategoryBanner category={currentCategory} />
      )}
      <div className={cn('mx-auto w-full px-2 lg:px-6')}>
        <div className="mx-auto w-full max-w-7xl p-0">
          <div className="flex items-start justify-between">
            <div className="w-full lg:border-r lg:border-slate-100">
              <div className="w-full lg:pr-6">
                {!currentCategory && type === 'listing' && (
                  <div className="pt-3">
                    {potentialSession || authenticated ? (
                      <UserStatsBanner />
                    ) : (
                      <BannerCarousel totalUsers={totalUsers?.totalUsers} />
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
