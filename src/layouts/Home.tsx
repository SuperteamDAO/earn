import { usePrivy } from '@privy-io/react-auth';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import React, { type ReactNode, useEffect, useState } from 'react';

import { type Superteam } from '@/constants/Superteam';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';

import { BannerCarousel } from '@/features/home/components/Banner';
import { NavTabs } from '@/features/home/components/NavTabs';
import { UserStatsBanner } from '@/features/home/components/UserStatsBanner';

interface HomeProps {
  children: ReactNode;
  type: 'landing' | 'listing' | 'category' | 'region' | 'feed';
  st?: Superteam;
  isAuth?: boolean;
}

type CategoryTypes = 'content' | 'development' | 'design' | 'other';

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

export function Home({ children, type, st, isAuth }: HomeProps) {
  const router = useRouter();
  const [currentCategory, setCurrentCategory] = useState<CategoryTypes | null>(
    null,
  );

  useEffect(() => {
    if (router.asPath.includes('/category/development/')) {
      setCurrentCategory('development');
    } else if (router.asPath.includes('/category/design/')) {
      setCurrentCategory('design');
    } else if (router.asPath.includes('/category/content/')) {
      setCurrentCategory('content');
    } else if (router.asPath.includes('/category/other/')) {
      setCurrentCategory('other');
    }
  }, [router.asPath]);

  const { authenticated } = usePrivy();

  return (
    <Default
      className="bg-white"
      meta={
        <Meta
          title="Superteam Earn | Work to Earn in Crypto"
          description="Explore the latest bounties on Superteam Earn, offering opportunities in the crypto space across Design, Development, and Content."
          canonical="https://earn.superteam.fun"
        />
      }
    >
      {type === 'region' && st && <RegionBanner st={st} />}
      {type === 'category' && currentCategory && (
        <CategoryBanner category={currentCategory} />
      )}
      <div className="mx-auto w-full px-2 lg:px-6">
        <div className="mx-auto w-full max-w-7xl p-0">
          <div className="flex items-start justify-between">
            <div className="w-full py-3 lg:border-r lg:border-slate-100">
              <div className="w-full pt-1 lg:pr-6">
                {type === 'landing' && (
                  <>
                    <NavTabs />
                    {isAuth ? <UserStatsBanner /> : <BannerCarousel />}
                  </>
                )}
                {type === 'listing' && (
                  <>
                    <NavTabs />
                    {!authenticated ? <BannerCarousel /> : <UserStatsBanner />}
                  </>
                )}
                {type === 'category' && <NavTabs />}
                {type === 'region' && <NavTabs className="mt-1" />}
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
