import Link from 'next/link';
import React from 'react';

import { Default } from '@/layouts/Default';
import { cn } from '@/utils/cn';

import {
  AllPostsIcon,
  HomeIcon,
  WinnersIcon,
} from '@/features/feed/components/icons';
import { HomeSideBar } from '@/features/home/components/SideBar';

interface NavItemProps {
  name: string;
  icon: React.ComponentType;
  href: string;
}

const NavItem = ({ name, icon: Icon, href }: NavItemProps) => {
  return (
    <Link href={href} className="flex items-center">
      <div className="flex h-9 w-9 items-center justify-center">
        <Icon />
      </div>
      <span className="font-medium text-slate-500">{name}</span>
    </Link>
  );
};

interface FeedPageProps {
  children: React.ReactNode;
  isHomePage?: boolean;
}

// Earn's feed frame: Home's `type="feed"` layout (with its sidebar) around
// the feed's own navigation.
export const FeedPageLayout = ({
  children,
  isHomePage = false,
}: FeedPageProps) => {
  return (
    <Default className="bg-white">
      <div className={cn('mx-auto w-full px-2 lg:px-6')}>
        <div className="mx-auto w-full max-w-7xl p-0">
          <div className="flex items-start justify-between">
            <div className="w-full min-w-0 lg:border-r lg:border-slate-100">
              <div className="w-full lg:pr-6">
                <div className="-mx-2 border-r border-slate-200 lg:-mr-[25px] lg:ml-0">
                  <div className="flex">
                    <div className="sticky top-14 hidden h-screen w-48 shrink-0 flex-col gap-3 border-r pt-5 pr-5 lg:flex">
                      <NavItem name="Homepage" icon={HomeIcon} href="/earn/" />
                      <NavItem
                        name="Winners"
                        icon={WinnersIcon}
                        href="/earn/feed/winners/"
                      />
                      {!isHomePage && (
                        <NavItem
                          name="All Posts"
                          icon={AllPostsIcon}
                          href="/earn/feed/"
                        />
                      )}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col lg:max-w-[44rem]">
                      {children}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="hidden lg:flex">
              <HomeSideBar type="feed" />
            </div>
          </div>
        </div>
      </div>
    </Default>
  );
};
