'use client';

import { usePathname } from 'next/navigation';
import { posthog } from 'posthog-js';
import { useMemo } from 'react';

import IoSearchOutline from '@/components/icons/IoSearchOutline';
import IoWalletOutline from '@/components/icons/IoWalletOutline';
import { Button } from '@/components/ui/button';
import { ExternalImage } from '@/components/ui/cloudinary-image';
import { LocalImage } from '@/components/ui/local-image';
import { Separator } from '@/components/ui/separator';
import { ResumingAccount } from '@/lib/auth/resume-session';
import { useViewer } from '@/lib/viewer';
import { cn } from '@/utils/cn';
import { formatNumberWithSuffix } from '@/utils/formatNumberWithSuffix';

import { CreditIcon } from '@/features/credits/icon/credit';
import { HACKATHONS } from '@/features/hackathon/constants/hackathons';

import { LISTING_NAV_ITEMS } from '../constants';
import { useAsPath } from '../hooks/use-here';
import { LogoContextMenu } from './LogoContextMenu';
import { NavLink } from './NavLink';
import { ShellLink, useShellNavigate } from './ShellLink';
import { UserMenu } from './UserMenu';

interface Props {
  signIn: string;
  resuming: boolean;
  onSearchOpen: () => void;
  walletBalance: number;
  creditBalance: number;
  onCreditOpen: () => void;
}

export const DesktopNavbar = ({
  signIn,
  resuming,
  onSearchOpen,
  onCreditOpen,
  walletBalance,
  creditBalance,
}: Props) => {
  const navigate = useShellNavigate();
  const pathname = usePathname() ?? '';
  const asPath = useAsPath();

  const user = useViewer();
  const authenticated = !!user;

  const isDashboardRoute = useMemo(
    () => pathname.startsWith('/earn/dashboard'),
    [pathname],
  );
  const isNewTalentRoute = useMemo(
    () => pathname.startsWith('/earn/new/talent'),
    [pathname],
  );

  const maxWidth = useMemo(() => {
    if (isDashboardRoute) {
      return 'max-w-full';
    }
    if (isNewTalentRoute) {
      return '2xl:max-w-[82rem]';
    }
    return 'max-w-7xl';
  }, [isDashboardRoute, isNewTalentRoute]);

  const padding = useMemo(() => {
    if (isDashboardRoute) {
      return 'pr-8 pl-6';
    }
    if (isNewTalentRoute) {
      return 'pr-8 pl-24 2xl:pl-0';
    }
    return 'px-2 lg:px-6';
  }, [isDashboardRoute, isNewTalentRoute]);

  const margin = useMemo(() => {
    if (isNewTalentRoute) {
      return 'mx-0 2xl:mx-auto';
    }
    return 'mx-auto';
  }, [isNewTalentRoute]);

  const openCreditDrawer = () => {
    posthog.capture('open_credits');
    onCreditOpen();
  };

  return (
    <div
      className={cn(
        'hidden h-14 border-b border-slate-200 bg-white text-slate-500 lg:flex',
        padding,
      )}
    >
      <div
        className={cn(
          'mx-auto flex w-full max-w-7xl justify-between',
          maxWidth,
          margin,
        )}
      >
        <div className="ph-no-capture flex w-fit items-center gap-3 lg:gap-5">
          <LogoContextMenu>
            <ShellLink
              href="/earn/"
              className="flex items-center gap-3 hover:no-underline"
              onClick={() => {
                posthog.capture('homepage logo click_universal');
              }}
            >
              <LocalImage
                className="h-[1.4rem] cursor-pointer object-contain"
                alt="Superteam Earn"
                src="/assets/logo.svg"
              />

              {isDashboardRoute && (
                <>
                  <div className="h-6 w-[1.5px] bg-slate-300" />
                  <p className="text-sm tracking-[1.5px]">SPONSORS</p>
                </>
              )}
            </ShellLink>
          </LogoContextMenu>

          <Separator orientation="vertical" className="h-6" />

          {!pathname.startsWith('/earn/new/') && (
            <>
              {LISTING_NAV_ITEMS?.map((navItem) => {
                const isCurrent = navItem.href === asPath;
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

              {HACKATHONS.map((hackathon) => (
                <ShellLink
                  href={`/earn/hackathon/${hackathon.slug}/`}
                  key={hackathon.slug}
                  className={cn('flex items-center py-2 font-medium', 'h-7')}
                  prefetch={false}
                >
                  <ExternalImage
                    src={hackathon.logo}
                    alt={hackathon.label}
                    className="h-full object-contain"
                  />
                </ShellLink>
              ))}
            </>
          )}

          {!pathname.startsWith('/earn/search') &&
            !pathname.startsWith('/earn/new/') && (
              <div
                className="flex cursor-pointer items-center gap-1.5 rounded-md border border-slate-300 px-2 py-2 text-slate-500 transition-all duration-100 hover:bg-slate-100 hover:text-slate-700"
                onClick={onSearchOpen}
              >
                <IoSearchOutline className="size-4" />
              </div>
            )}
        </div>

        <div className="flex items-center gap-4 py-1.5">
          {resuming && !authenticated && <ResumingAccount signIn={signIn} />}

          {authenticated && (
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
                  <ShellLink href="/earn/dashboard/listings/">
                    <span>Dashboard</span>
                    <div className="block h-1.5 w-1.5 rounded-full bg-sky-400" />
                  </ShellLink>
                </Button>
              )}

              {user?.isTalentFilled && (
                <div className="flex items-center gap-1.5">
                  <div
                    className="flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-2 text-slate-500 transition-all duration-100 hover:bg-slate-100 hover:text-slate-700"
                    onClick={openCreditDrawer}
                  >
                    <CreditIcon className={cn('size-4', 'text-brand-purple')} />
                    <p
                      className={cn('text-sm font-semibold', 'text-slate-500')}
                    >
                      {creditBalance}
                    </p>
                  </div>
                  <div className="relative">
                    {/* Plain <a>: the wallet is a Privy document with its
                        own CSP. */}
                    {/* oxlint-disable-next-line nextjs/no-html-link-for-pages */}
                    <a
                      href="/earn/wallet/"
                      className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-slate-500 transition-all duration-100 hover:bg-slate-100 hover:text-slate-700"
                      onClick={() => posthog.capture('open_wallet_drawer')}
                    >
                      <IoWalletOutline
                        className={cn('size-6', 'text-brand-purple')}
                      />
                      <span
                        className={cn(
                          'absolute top-px -right-1.5 block rounded-md px-1 py-px text-[10px] font-semibold tracking-tight text-white',
                          'bg-brand-purple/95',
                        )}
                      >
                        ${formatNumberWithSuffix(walletBalance || 0, 1, false)}
                      </span>
                    </a>
                  </div>
                </div>
              )}
              <UserMenu />
            </div>
          )}

          {!authenticated && !resuming && (
            <div className="ph-no-capture flex items-center gap-2">
              <div className="flex items-center gap-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs font-semibold"
                  onClick={() => {
                    posthog.capture('create a listing_navbar');
                    navigate('/earn/sponsor/');
                  }}
                >
                  <span>Become a Sponsor</span>
                  <div className="block h-1.5 w-1.5 rounded-full bg-sky-400" />
                </Button>
                {/* Plain <a>: sign-in is a Privy document with its own CSP. */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs font-semibold"
                  asChild
                >
                  <a
                    href={signIn}
                    onClick={() => {
                      posthog.capture('login_navbar');
                    }}
                  >
                    Login
                  </a>
                </Button>
              </div>
              <Button
                variant="default"
                size="sm"
                className="my-1 w-full px-4 text-xs font-semibold"
                asChild
              >
                <a
                  href={signIn}
                  onClick={() => {
                    posthog.capture('signup_navbar');
                  }}
                >
                  Sign Up
                </a>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
