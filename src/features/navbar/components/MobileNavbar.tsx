import { usePrivy } from '@privy-io/react-auth';
import { AlignLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { usePostHog } from 'posthog-js/react';
import React, { useEffect, useRef, useState } from 'react';
import { IoWalletOutline } from 'react-icons/io5';

import { Button } from '@/components/ui/button';
import { ExternalImage } from '@/components/ui/cloudinary-image';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetClose, SheetContent } from '@/components/ui/sheet';
import { useDisclosure } from '@/hooks/use-disclosure';
import { useCreditBalance } from '@/store/credit';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';
import { formatNumberWithSuffix } from '@/utils/formatNumberWithSuffix';

import { CreditIcon } from '@/features/credits/icon/credit';

import {
  CATEGORY_NAV_ITEMS,
  LISTING_NAV_ITEMS,
  renderLabel,
} from '../constants';
import { NavLink } from './NavLink';
import { UserMenu } from './UserMenu';

interface Props {
  onLoginOpen: () => void;
  onWalletOpen: () => void;
  onCreditOpen: () => void;
  walletBalance: number;
}

// const AnnouncementBar = dynamic(() =>
//   import('@/features/navbar').then((mod) => mod.AnnouncementBar),
// );

export const MobileNavbar = ({
  onLoginOpen,
  onWalletOpen,
  onCreditOpen,
  walletBalance,
}: Props) => {
  const {
    isOpen: isDrawerOpen,
    onOpen: onDrawerOpen,
    onClose: onDrawerClose,
  } = useDisclosure();

  const { authenticated, ready } = usePrivy();
  const posthog = usePostHog();

  const btnRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();

  const { user } = useUser();
  const { creditBalance } = useCreditBalance();

  const [hideListingTypes, setHideListingTypes] = useState(false);
  useEffect(() => {
    const listingPage = router.asPath.split('/')[1] === 'listings';
    // can add more when needed, create more, add those variables below with OR (a || b) format
    setHideListingTypes(listingPage);
  }, []);

  const openCreditDrawer = () => {
    posthog.capture('open_credits');
    onCreditOpen();
  };

  const MobileDrawer = () => {
    return (
      <Sheet open={isDrawerOpen} onOpenChange={onDrawerClose}>
        <SheetContent side="left" className="w-[300px] p-0 sm:w-[380px]">
          <SheetClose />
          <div className="px-4 pb-8">
            {ready && !authenticated && (
              <div className="ph-no-capture flex items-center gap-3">
                <Button
                  variant="link"
                  className="text-semibold mr-3 p-0 text-slate-500"
                  onClick={() => {
                    posthog.capture('login_navbar');
                    onDrawerClose();
                    onLoginOpen();
                  }}
                >
                  Login
                </Button>
                <Separator
                  orientation="vertical"
                  className="h-5 bg-slate-300"
                />
                <Button
                  variant="ghost"
                  className="text-semibold text-brand-purple"
                  onClick={() => {
                    posthog.capture('signup_navbar');
                    onDrawerClose();
                    onLoginOpen();
                  }}
                >
                  Sign Up
                </Button>
              </div>
            )}

            {user && !user.currentSponsorId && !user.isTalentFilled && (
              <Button
                variant="ghost"
                className="text-brand-purple text-base"
                onClick={() => {
                  router.push('/new');
                }}
              >
                Complete your Profile
              </Button>
            )}
            <div className="ph-no-capture flex flex-col">
              {LISTING_NAV_ITEMS?.map((navItem) => {
                const isCurrent = `${navItem.href}` === router.asPath;
                return (
                  <NavLink
                    onClick={() => {
                      posthog.capture(navItem.posthog);
                      onDrawerClose();
                    }}
                    key={navItem.label}
                    className="ph-no-capture"
                    href={navItem.href ?? '#'}
                    label={renderLabel(navItem)}
                    isActive={isCurrent}
                  />
                );
              })}
            </div>
            <Separator className="my-2 bg-slate-300" />
            <div className="ph-no-capture flex flex-col">
              {CATEGORY_NAV_ITEMS?.map((navItem) => {
                const isCurrent = `${navItem.href}` === router.asPath;
                return (
                  <NavLink
                    className="ph-no-capture"
                    onClick={() => {
                      posthog.capture(navItem.posthog);
                      onDrawerClose();
                    }}
                    key={navItem.label}
                    href={navItem.href ?? '#'}
                    label={renderLabel(navItem)}
                    isActive={isCurrent}
                  />
                );
              })}
            </div>
            <Separator className="my-2 bg-slate-300" />
            <NavLink
              href={'/feed'}
              label={'Activity Feed'}
              isActive={false}
              onClick={onDrawerClose}
            />
            <NavLink
              href={'/leaderboard'}
              label={'Leaderboard'}
              isActive={false}
              onClick={onDrawerClose}
            />
            <Link
              href={'/hackathon/breakout'}
              className={cn('flex items-center py-2 font-medium', 'h-10')}
            >
              <ExternalImage
                alt="Redacted Logo"
                src="/hackathon/breakout/logo"
                className="h-full object-contain"
              />
            </Link>
            <Link
              href={'/hackathon/redacted'}
              className={cn('flex items-center py-2 font-medium', 'h-10')}
            >
              <ExternalImage
                alt="Redacted Logo"
                src="/hackathon/redacted/logo-black"
                className="h-full object-contain"
              />
            </Link>
          </div>
        </SheetContent>
      </Sheet>
    );
  };

  return (
    <>
      {/* {router.pathname === '/' && <AnnouncementBar />} */}
      <div className="sticky top-0 z-50">
        <div className="flex items-center justify-between border-b border-black/20 bg-white px-1 py-0.5 lg:hidden">
          <div className="flex items-center gap-0">
            <Button
              ref={btnRef}
              variant="ghost"
              size="sm"
              className="hover:bg-transparent"
              onClick={onDrawerOpen}
            >
              <AlignLeft className="h-6 w-6 text-slate-600" />
            </Button>
            <Link
              href="/"
              className="flex items-center hover:no-underline"
              onClick={() => {
                posthog.capture('homepage logo click_universal');
              }}
            >
              <img
                className="h-[1.3rem] cursor-pointer object-contain"
                alt="Superteam Earn"
                src="/assets/logo.svg"
              />
            </Link>
          </div>

          <MobileDrawer />
          <div className="flex items-center gap-1">
            {ready && authenticated && user?.isTalentFilled && (
              <div className="flex items-center gap-0 sm:gap-1">
                <div className="relative">
                  <div
                    className="flex cursor-pointer items-center gap-1 rounded-md px-2 py-1.5 text-slate-500 transition-all duration-100 hover:bg-slate-100 hover:text-slate-700 md:gap-2"
                    onClick={openCreditDrawer}
                  >
                    <CreditIcon className="text-brand-purple h-5 w-5" />
                    <p className="text-sm font-semibold">{creditBalance}</p>
                  </div>
                </div>
                <div className="relative">
                  <div
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-slate-500 transition-all duration-100 hover:bg-slate-100 hover:text-slate-700"
                    onClick={onWalletOpen}
                  >
                    <IoWalletOutline className="text-brand-purple h-7 w-7" />
                    <span className="bg-brand-purple/95 absolute top-px -right-1.5 block rounded-md px-1 py-px text-[10px] font-semibold tracking-tight text-white">
                      ${formatNumberWithSuffix(walletBalance || 0, 1, true)}
                    </span>
                  </div>
                </div>
              </div>
            )}
            {ready && authenticated && <UserMenu />}
          </div>
          {ready && !authenticated && (
            <Button
              variant="ghost"
              className="ph-no-capture text-brand-purple mr-2 text-base"
              onClick={() => {
                posthog.capture('login_navbar');
                onLoginOpen();
              }}
            >
              Login
            </Button>
          )}
        </div>
      </div>
      {!router.asPath.startsWith('/new/') && (
        <div className="flex items-center justify-between bg-slate-50 px-3 py-0 sm:px-4 lg:hidden">
          <div
            className={cn(
              'ph-no-capture mx-auto flex w-full justify-evenly gap-8 pl-1 sm:gap-8 md:gap-12',
              hideListingTypes ? 'hidden' : 'flex',
            )}
          >
            {LISTING_NAV_ITEMS?.map((navItem) => {
              const isCurrent = `${navItem.href}` === router.asPath;
              return (
                <NavLink
                  onClick={() => {
                    posthog.capture(navItem.posthog);
                  }}
                  className="ph-no-capture h-auto border-b-0 py-2 text-sm font-medium lg:py-3"
                  key={navItem.label}
                  href={navItem.href ?? '#'}
                  label={renderLabel(navItem)}
                  isActive={isCurrent}
                />
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};
