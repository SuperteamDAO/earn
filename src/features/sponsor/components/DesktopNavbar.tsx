import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { usePostHog } from 'posthog-js/react';
import React from 'react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';

import { UserMenu } from '@/features/navbar/components/UserMenu';

import { NAV_LINKS } from '../utils/constants';

export const DesktopNavbar = () => {
  const { data: session, status } = useSession();
  const { user } = useUser();
  const posthog = usePostHog();
  const router = useRouter();

  const isDashboardRoute = router.pathname.startsWith('/dashboard');
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
            <img
              className="h-5 cursor-pointer object-contain"
              alt="Superteam Earn"
              src="/assets/logo.svg"
            />
            <div className="h-6 w-[3px] bg-slate-400" />
            <p className="text-sm font-semibold tracking-[1.5px] text-slate-500">
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
          {status === 'loading' && !session && (
            <div className="flex items-center gap-2">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-4 w-20" />
            </div>
          )}

          <div className="flex gap-2">
            <div className="flex items-center">
              {status === 'authenticated' && !!user?.currentSponsorId && (
                <Link
                  className="ph-no-capture"
                  href="/dashboard/listings/?open=1"
                  onClick={() => posthog.capture('create a listing_navbar')}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="bg-white font-semibold text-indigo-600"
                  >
                    Create a Listing
                  </Button>
                </Link>
              )}
              {status === 'authenticated' && !user?.currentSponsorId && (
                <Link
                  className="ph-no-capture"
                  href="/new/sponsor/"
                  onClick={() => posthog.capture('get started_sponsor navbar')}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="bg-white font-semibold text-indigo-600"
                  >
                    Get Started
                  </Button>
                </Link>
              )}
              {status === 'authenticated' && session && <UserMenu />}
            </div>
          </div>

          {status === 'unauthenticated' && !session && (
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
                  onClick={() => posthog.capture('get started_sponsor navbar')}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="bg-white font-semibold text-indigo-600"
                  >
                    Get Started
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
