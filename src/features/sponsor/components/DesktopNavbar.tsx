'use client';
import { usePrivy } from '@privy-io/react-auth';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import posthog from 'posthog-js';
import React from 'react';

import { Button } from '@/components/ui/button';
import { LocalImage } from '@/components/ui/local-image';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';

import { UserMenu } from '@/features/navbar/components/UserMenu';

import { NAV_LINKS } from '../utils/constants';

export const DesktopNavbar = () => {
  const { authenticated, ready } = usePrivy();
  const { user } = useUser();

  const pathname = usePathname();

  const isDashboardRoute = pathname?.startsWith('/dashboard');
  const maxWValue = isDashboardRoute ? '' : 'max-w-7xl';

  return (
    <div className="z-10 hidden border-b border-black/20 bg-white px-2 text-slate-500 lg:flex lg:px-6">
      <div className={cn('mx-auto flex w-full justify-between', maxWValue)}>
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="mr-5 flex items-center gap-3 hover:no-underline"
            onClick={() => {
              posthog.capture('homepage logo click_universal');
            }}
          >
            <LocalImage
              className="h-[1.4rem] cursor-pointer object-contain"
              alt="Superteam Earn"
              src="/assets/logo.svg"
              loading="eager"
            />
            <div className="h-6 w-[1.5px] rotate-10 bg-slate-300" />
            <p className="text-sm font-medium tracking-[1.6px] text-slate-400">
              SPONSORS
            </p>
          </Link>
        </div>

        <div className="absolute left-1/2 -translate-x-1/2">
          <div className="ml-10 flex h-full items-center justify-center">
            <div className="flex h-full items-center gap-7">
              {NAV_LINKS?.map((navItem) => (
                <Link
                  key={navItem.label}
                  href={navItem.link ?? '#'}
                  className="flex h-8 items-center py-2 text-lg font-medium text-slate-500 hover:text-slate-600 hover:no-underline lg:h-14 lg:text-sm"
                >
                  {navItem.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-end gap-4 py-2">
          {!ready && (
            <div className="flex items-center gap-2">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-4 w-20" />
            </div>
          )}

          <div className="flex gap-2">
            <div className="flex items-center">
              {authenticated && !!user?.currentSponsorId && (
                <Link
                  className="ph-no-capture"
                  href="/dashboard/listings/?open=1"
                  onClick={() => {
                    posthog?.capture('get started navbar_sponsor lp');
                  }}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white font-semibold text-indigo-600"
                  >
                    Post for Free
                  </Button>
                </Link>
              )}
              {authenticated && !user?.currentSponsorId && (
                <Link
                  className="ph-no-capture"
                  href="/new/sponsor/"
                  onClick={() => {
                    posthog?.capture('get started navbar_sponsor lp');
                  }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="bg-white font-semibold text-indigo-600"
                  >
                    Post for Free
                  </Button>
                </Link>
              )}
              {authenticated && <UserMenu />}
            </div>
          </div>

          {ready && !authenticated && (
            <div className="flex gap-2">
              <div className="flex">
                <Link
                  className="ph-no-capture"
                  href="/new/sponsor/"
                  onClick={() => posthog.capture('login_navbar')}
                >
                  <Button variant="ghost" size="sm" className="text-xs">
                    Login
                  </Button>
                </Link>
                <Link
                  className="ph-no-capture"
                  href="/new/sponsor/"
                  onClick={() => {
                    posthog?.capture('get started navbar_sponsor lp');
                  }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="bg-white font-semibold text-indigo-600"
                  >
                    Post for Free
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
