import { usePrivy } from '@privy-io/react-auth';
import { Gift } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import posthog from 'posthog-js';
import { useEffect, useMemo, useState } from 'react';

import IoSearchOutline from '@/components/icons/IoSearchOutline';
import IoWalletOutline from '@/components/icons/IoWalletOutline';
import { Button } from '@/components/ui/button';
import { ExternalImage } from '@/components/ui/cloudinary-image';
import { LocalImage } from '@/components/ui/local-image';
import { Skeleton } from '@/components/ui/skeleton';
import { useCreditBalance } from '@/store/credit';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';
import { formatNumberWithSuffix } from '@/utils/formatNumberWithSuffix';

import { CreditIcon } from '@/features/credits/icon/credit';
import { HACKATHONS } from '@/features/hackathon/constants/hackathons';

import { LISTING_NAV_ITEMS } from '../constants';
import { LogoContextMenu } from './LogoContextMenu';
import { NavLink } from './NavLink';
import { UserMenu } from './UserMenu';

interface Props {
  onLoginOpen: () => void;
  onSearchOpen: () => void;
  onWalletOpen: () => void;
  walletBalance: number;
  onCreditOpen: () => void;
  onReferralOpen: () => void;
}

export const DesktopNavbar = ({
  onLoginOpen,
  onSearchOpen,
  onWalletOpen,
  onCreditOpen,
  onReferralOpen,
  walletBalance,
}: Props) => {
  const { authenticated, ready } = usePrivy();
  const router = useRouter();

  const { user, isLoading } = useUser();
  const { creditBalance } = useCreditBalance();

  const [authUiReady, setAuthUiReady] = useState(() => ready);
  useEffect(() => {
    if (!ready) {
      setAuthUiReady(false);
      return;
    }
    setAuthUiReady(true);
  }, [ready, authenticated]);

  useEffect(() => {
    console.log('[DesktopNavbar] Auth State:', {
      ready,
      authenticated,
      authUiReady,
      isLoading,
      hasUser: !!user,
      userId: user?.id,
      showingSkeleton: (!authUiReady && !authenticated) || (isLoading && !user),
    });
  }, [ready, authenticated, authUiReady, isLoading, user]);

  const isDashboardRoute = useMemo(
    () => router.pathname.startsWith('/dashboard'),
    [router.pathname],
  );
  const isNewTalentRoute = useMemo(
    () => router.pathname.startsWith('/new/talent'),
    [router.pathname],
  );

  const hideSponsorCTA = useMemo(() => {
    if (!isNewTalentRoute) return false;
    try {
      const url = new URL(window.location.origin + router.asPath);
      return url.searchParams.get('referral') === 'true';
    } catch {
      return router.asPath.includes('referral=true');
    }
  }, [isNewTalentRoute, router.asPath]);

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
        <div className="flex w-fit items-center gap-3 lg:gap-4">
          <LogoContextMenu>
            <Link
              href="/"
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
            </Link>
          </LogoContextMenu>

          {!router.pathname.startsWith('/search') &&
            !router.pathname.startsWith('/new/') && (
              <div
                className="flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-2 text-slate-500 transition-all duration-100 hover:bg-slate-100 hover:text-slate-700"
                onClick={onSearchOpen}
              >
                <IoSearchOutline className="size-5" />
              </div>
            )}
        </div>

        {!router.pathname.startsWith('/new/') && (
          <div className="w-fit xl:absolute xl:left-2/4 xl:-translate-x-2/4">
            <div className="mx-6 flex h-full items-center justify-center">
              <div className="ph-no-capture flex h-full flex-row items-center gap-4.5">
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
                {HACKATHONS.map((hackathon) => (
                  <Link
                    href={`/hackathon/${hackathon.slug}`}
                    key={hackathon.slug}
                    className={cn(
                      'flex items-center py-2 font-medium',
                      'h-[1.85rem]',
                    )}
                    prefetch={false}
                  >
                    <ExternalImage
                      src={hackathon.logo}
                      alt={hackathon.label}
                      className="h-full object-contain"
                    />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-4 py-1.5">
          {((!authUiReady && !authenticated) || (isLoading && !user)) && (
            <div className="flex items-center gap-2">
              <Skeleton className="size-7 rounded-full" />
              <Skeleton className="mr-4 h-3 w-20" />
            </div>
          )}

          {authUiReady && authenticated && (
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
                    <span>Dashboard</span>
                    <div className="block h-1.5 w-1.5 rounded-full bg-sky-400" />
                  </Link>
                </Button>
              )}

              {!user?.currentSponsorId && user?.isTalentFilled && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-brand-purple hover:text-brand-purple bg-indigo-50 text-xs font-semibold hover:bg-indigo-100"
                  onClick={onReferralOpen}
                >
                  <Gift />
                  <span>Get Free Credits</span>
                </Button>
              )}

              {user?.isTalentFilled && (
                <div className="flex items-center gap-1.5">
                  <div
                    className="flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-2 text-slate-500 transition-all duration-100 hover:bg-slate-100 hover:text-slate-700"
                    onClick={openCreditDrawer}
                  >
                    <CreditIcon className="text-brand-purple size-4" />
                    <p className="text-sm font-semibold">{creditBalance}</p>
                  </div>
                  <div className="relative">
                    <div
                      className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-slate-500 transition-all duration-100 hover:bg-slate-100 hover:text-slate-700"
                      onClick={onWalletOpen}
                    >
                      <IoWalletOutline className="text-brand-purple size-6" />
                      <span className="bg-brand-purple/95 absolute top-px -right-1.5 block rounded-md px-1 py-px text-[10px] font-semibold tracking-tight text-white">
                        ${formatNumberWithSuffix(walletBalance || 0, 1, false)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              <UserMenu />
            </div>
          )}

          {authUiReady && !authenticated && (
            <div className="ph-no-capture flex items-center gap-2">
              <div className="flex items-center gap-0">
                {!hideSponsorCTA && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs font-semibold"
                    onClick={() => {
                      posthog.capture('create a listing_navbar');
                      router.push('/sponsor');
                    }}
                  >
                    <span>Become a Sponsor</span>
                    <div className="block h-1.5 w-1.5 rounded-full bg-sky-400" />
                  </Button>
                )}
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
