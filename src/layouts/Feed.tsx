import Link from 'next/link';
import React from 'react';

import { Home } from '@/layouts/Home';

import {
  AllPostsIcon,
  HomeIcon,
  LeaderboardIcon,
  WinnersIcon,
} from '@/features/feed/components/icons';

interface NavItemProps {
  name: string;
  icon: any;
  href: string;
}

const NavItem = ({ name, icon: Icon, href }: NavItemProps) => {
  return (
    <Link href={href} className="flex items-center">
      <div className="flex h-9 w-9 items-center justify-center">
        <Icon />
      </div>
      <span className="mt-1 font-medium text-slate-500">{name}</span>
    </Link>
  );
};

interface FeedPageProps {
  children: React.ReactNode;
  isHomePage?: boolean;
}

export const FeedPageLayout = ({
  children,
  isHomePage = false,
}: FeedPageProps) => {
  return (
    <Home type="feed">
      <div className="-mt-4 -mr-[10px] -ml-5 border-r border-slate-200 lg:-mr-[25px] lg:ml-0">
        <div className="flex">
          <div className="sticky top-14 hidden h-screen w-48 flex-col gap-3 border-r pt-5 pr-5 lg:flex">
            <NavItem name="Homepage" icon={HomeIcon} href="/" />
            <NavItem
              name="Leaderboard"
              icon={LeaderboardIcon}
              href="/leaderboard"
            />
            <NavItem name="Winners" icon={WinnersIcon} href="/feed/winners" />
            {!isHomePage && (
              <NavItem name="All Posts" icon={AllPostsIcon} href="/feed" />
            )}
          </div>
          <div className="flex w-full flex-col lg:max-w-[44rem]">
            {children}
          </div>
        </div>
      </div>
    </Home>
  );
};
