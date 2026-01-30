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
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useCreditBalance } from '@/store/credit';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';
import { formatNumberWithSuffix } from '@/utils/formatNumberWithSuffix';

import { CreditIcon } from '@/features/credits/icon/credit';
import { HACKATHONS } from '@/features/hackathon/constants/hackathons';
import { ProBadge } from '@/features/pro/components/ProBadge';

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

  const isDashboardRoute = useMemo(
    () => router.pathname.startsWith('/earn/dashboard'),
    [router.pathname],
  );
  const isNewTalentRoute = useMemo(
    () => router.pathname.startsWith('/earn/new/talent'),
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

  const isPro = user?.isPro;

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
            <Link
              href="/earn"
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

          <Separator orientation="vertical" className="h-6" />

          {!router.pathname.startsWith('/earn/new/') && (
            <>
              {LISTING_NAV_ITEMS?.map((navItem) => {
                const isCurrent = `${navItem.href}` === router.asPath;
                return (
                  <NavLink
                    isPro={isPro}
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

              <NavLink
                isPro={isPro}
                className="ph-no-capture"
                onClick={() => {
                  posthog.capture('pro_navbar');
                }}
                href="/earn/pro"
                label={
                  <ProBadge
                    containerClassName="gap-1 mt-px"
                    iconClassName="size-4 text-zinc-600"
                    textClassName="text-xs font-medium text-slate-600"
                  />
                }
                isActive={router.pathname === '/earn/pro'}
              />

              {HACKATHONS.map((hackathon) => (
                <Link
                  href={`/earn/hackathon/${hackathon.slug}`}
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
            </>
          )}

          {!router.pathname.startsWith('/earn/search') &&
            !router.pathname.startsWith('/earn/new/') && (
              <div
                className="flex cursor-pointer items-center gap-1.5 rounded-md border border-slate-300 px-2 py-2 text-slate-500 transition-all duration-100 hover:bg-slate-100 hover:text-slate-700"
                onClick={onSearchOpen}
              >
                <IoSearchOutline className="size-4" />
              </div>
            )}
        </div>

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
                  <Link href="/earn/dashboard/listings">
                    <span>Dashboard</span>
                    <div className="block h-1.5 w-1.5 rounded-full bg-sky-400" />
                  </Link>
                </Button>
              )}

              {!user?.currentSponsorId && user?.isTalentFilled && (
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'text-brand-purple hover:text-brand-purple bg-indigo-50 text-xs font-semibold hover:bg-indigo-100',
                    isPro &&
                      'bg-zinc-200 text-zinc-700 hover:bg-zinc-300 hover:text-zinc-700',
                  )}
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
                    <CreditIcon
                      className={cn(
                        'size-4',
                        isPro ? 'text-zinc-600' : 'text-brand-purple',
                      )}
                    />
                    <p
                      className={cn(
                        'text-sm font-semibold',
                        isPro ? 'text-zinc-600' : 'text-slate-500',
                      )}
                    >
                      {creditBalance}
                    </p>
                  </div>
                  <div className="relative">
                    <div
                      className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-slate-500 transition-all duration-100 hover:bg-slate-100 hover:text-slate-700"
                      onClick={onWalletOpen}
                    >
                      <IoWalletOutline
                        className={cn(
                          'size-6',
                          isPro ? 'text-zinc-600' : 'text-brand-purple',
                        )}
                      />
                      <span
                        className={cn(
                          'absolute top-px -right-1.5 block rounded-md px-1 py-px text-[10px] font-semibold tracking-tight text-white',
                          isPro ? 'bg-zinc-700' : 'bg-brand-purple/95',
                        )}
                      >
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
                      router.push('/earn/sponsor');
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
