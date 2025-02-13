import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { usePostHog } from 'posthog-js/react';
import { IoSearchOutline } from 'react-icons/io5';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PROJECT_NAME } from '@/constants/project';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';

import { LISTING_NAV_ITEMS } from '../constants';
import { NavLink } from './NavLink';
import { UserMenu } from './UserMenu';

interface Props {
  onLoginOpen: () => void;
  onSearchOpen: () => void;
}

const LogoContextMenu = dynamic(() =>
  import('./LogoContextMenu').then((mod) => mod.LogoContextMenu),
);

export const DesktopNavbar = ({ onLoginOpen, onSearchOpen }: Props) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const posthog = usePostHog();
  const { user } = useUser();

  const isDashboardRoute = router.pathname.startsWith('/dashboard');
  const maxWidth = isDashboardRoute ? 'max-w-full' : 'max-w-7xl';
  const padding = isDashboardRoute ? 'pr-8 pl-6' : 'px-2 lg:px-6';

  return (
    <div
      className={cn(
        'hidden h-14 border-b border-slate-200 bg-white text-slate-500 lg:flex',
        padding,
      )}
    >
      <div className={cn('mx-auto flex w-full justify-between', maxWidth)}>
        <div className="flex items-center gap-3 lg:gap-6">
          <LogoContextMenu>
            <Link
              href="/"
              className="mr-5 flex items-center gap-3 hover:no-underline"
              onClick={() => {
                posthog.capture('homepage logo click_universal');
              }}
            >
              <img
                className="h-5 cursor-pointer object-contain"
                alt={`${PROJECT_NAME} Logo`}
                src="/assets/logo.svg"
              />

              {isDashboardRoute && (
                <>
                  <div className="h-6 w-[1.5px] bg-slate-300" />
                  <p className="text-sm tracking-[1.5px]">SPONSORS</p>
                </>
              )}
            </Link>
          </LogoContextMenu>

          {router.pathname !== '/search' &&
            !router.pathname.startsWith('/new/') && (
              <Button
                className="ph-no-capture gap-2 border-none font-normal text-slate-700 shadow-none hover:bg-slate-100"
                variant="outline"
                onClick={onSearchOpen}
              >
                <IoSearchOutline className="h-4 w-4" />
              </Button>
            )}
        </div>

        {!router.pathname.startsWith('/new/') && (
          <div className="absolute left-1/2 -translate-x-1/2">
            <div className="ml-10 flex h-full items-center justify-center">
              <div className="ph-no-capture flex h-full flex-row gap-7">
                {LISTING_NAV_ITEMS?.map((navItem) => {
                  const isCurrent = `${navItem.href}` === router.asPath;
                  return (
                    <NavLink
                      className="ph-no-capture"
                      onClick={() => {
                        posthog.capture(navItem.posthog);
                      }}
                      key={navItem.label}
                      href={navItem.href ?? '#'}
                      label={navItem.label}
                      isActive={isCurrent}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-1 items-center justify-end gap-4 py-1.5">
          {status === 'loading' && !session && (
            <div className="flex items-center gap-2">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-4 w-20" />
            </div>
          )}

          {status === 'authenticated' && session && (
            <div className="ph-no-capture flex items-center gap-2">
              {user?.currentSponsorId && !isDashboardRoute && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs font-semibold"
                  onClick={() => {
                    posthog.capture('sponsor dashboard_navbar');
                  }}
                  asChild
                >
                  <Link href="/dashboard/listings">
                    Sponsor Dashboard
                    <div className="block h-1.5 w-1.5 rounded-full bg-sky-400" />
                  </Link>
                </Button>
              )}
              <UserMenu />
            </div>
          )}

          {status === 'unauthenticated' && !session && (
            <div className="ph-no-capture flex items-center gap-2">
              <div className="flex items-center gap-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs font-semibold"
                  onClick={() => {
                    posthog.capture('create a listing_navbar');
                    router.push('/sponsor');
                  }}
                >
                  Become a Sponsor
                  <div className="block h-1.5 w-1.5 rounded-full bg-sky-400" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs font-semibold"
                  onClick={() => {
                    posthog.capture('login_navbar');
                    onLoginOpen();
                  }}
                >
                  Login
                </Button>
              </div>
              <Button
                variant="default"
                size="sm"
                className="my-1 w-full px-4 text-xs font-semibold"
                onClick={() => {
                  posthog.capture('signup_navbar');
                  onLoginOpen();
                }}
              >
                Sign Up
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
