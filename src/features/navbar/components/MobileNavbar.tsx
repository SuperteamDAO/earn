import { Menu } from 'lucide-react';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { usePostHog } from 'posthog-js/react';
import React, { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetClose, SheetContent } from '@/components/ui/sheet';
import { useDisclosure } from '@/hooks/use-disclosure';
import { useUser } from '@/store/user';
import { cn } from '@/utils';

import {
  CATEGORY_NAV_ITEMS,
  LISTING_NAV_ITEMS,
  renderLabel,
} from '../constants';
import { NavLink } from './NavLink';
import { UserMenu } from './UserMenu';

interface Props {
  onLoginOpen: () => void;
}

// const AnnouncementBar = dynamic(() =>
//   import('@/features/navbar').then((mod) => mod.AnnouncementBar),
// );

export const MobileNavbar = ({ onLoginOpen }: Props) => {
  const {
    isOpen: isDrawerOpen,
    onOpen: onDrawerOpen,
    onClose: onDrawerClose,
  } = useDisclosure();

  const { data: session, status } = useSession();
  const posthog = usePostHog();

  const btnRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();

  const { user } = useUser();

  const [hideListingTypes, setHideListingTypes] = useState(false);
  useEffect(() => {
    const listingPage = router.asPath.split('/')[1] === 'listings';
    // can add more when needed, create more, add those variables below with OR (a || b) format
    setHideListingTypes(listingPage);
  }, []);

  const MobileDrawer = () => {
    return (
      <Sheet open={isDrawerOpen} onOpenChange={onDrawerClose}>
        <SheetContent side="left" className="w-[300px] p-0 sm:w-[380px]">
          <SheetClose />
          <div className="px-4 pb-8">
            {status === 'unauthenticated' && !session && (
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
                className="text-base text-brand-purple"
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
          </div>
        </SheetContent>
      </Sheet>
    );
  };

  return (
    <>
      {/* {router.pathname === '/' && <AnnouncementBar />} */}
      <div className="sticky top-0 z-50">
        <div className="flex items-center justify-between border-b border-black/20 bg-white px-1 py-2 lg:hidden">
          <div>
            <Button
              ref={btnRef}
              variant="ghost"
              size="sm"
              className="hover:bg-transparent"
              onClick={onDrawerOpen}
            >
              <Menu className="h-6 w-6 text-slate-500" />
            </Button>
          </div>

          <MobileDrawer />
          <div className="absolute left-1/2 -translate-x-1/2">
            <NextLink
              href="/"
              className="flex items-center hover:no-underline"
              onClick={() => {
                posthog.capture('homepage logo click_universal');
              }}
            >
              <img
                className="h-5 cursor-pointer object-contain"
                alt="Superteam Earn"
                src="/assets/logo/logo.svg"
              />
            </NextLink>
          </div>
          {status === 'authenticated' && session && <UserMenu />}
          {status === 'unauthenticated' && !session && (
            <Button
              variant="ghost"
              className="ph-no-capture mr-2 text-base text-brand-purple"
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
      <div className="flex items-center justify-between bg-[#F8FAFC] px-3 py-0 sm:px-4 lg:hidden">
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
    </>
  );
};
