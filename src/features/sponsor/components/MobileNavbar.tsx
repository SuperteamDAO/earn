import { usePrivy } from '@privy-io/react-auth';
import { Menu } from 'lucide-react';
import Link from 'next/link';
import { usePostHog } from 'posthog-js/react';
import React, { useRef } from 'react';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetClose, SheetContent } from '@/components/ui/sheet';
import { useDisclosure } from '@/hooks/use-disclosure';
import { useUser } from '@/store/user';

import { UserMenu } from '@/features/navbar/components/UserMenu';

import { NAV_LINKS } from '../utils/constants';

export const MobileNavbar = () => {
  const {
    isOpen: isDrawerOpen,
    onOpen: onDrawerOpen,
    onClose: onDrawerClose,
  } = useDisclosure();

  const { authenticated, ready } = usePrivy();
  const { user } = useUser();
  const posthog = usePostHog();
  const btnRef = useRef<HTMLButtonElement>(null);

  const MobileDrawer = () => {
    return (
      <Sheet open={isDrawerOpen} onOpenChange={onDrawerClose}>
        <SheetContent
          side="left"
          className="block w-[300px] p-0 sm:w-[380px] lg:hidden"
        >
          <div className="flex px-3 py-2">
            <SheetClose />
          </div>
          <div className="px-6">
            {ready && !authenticated && (
              <div className="flex items-center gap-3">
                <Link
                  className="ph-no-capture"
                  href="/new/sponsor/"
                  onClick={() => posthog.capture('login_navbar')}
                >
                  <Button variant="ghost" className="text-base text-slate-500">
                    Login
                  </Button>
                </Link>
                <Separator
                  orientation="vertical"
                  className="h-5 bg-slate-300"
                />
                <Link
                  className="ph-no-capture"
                  href="/new/sponsor/"
                  onClick={() => posthog.capture('get started_sponsor navbar')}
                >
                  <Button
                    variant="ghost"
                    className="bg-white font-semibold text-indigo-600"
                  >
                    Get Started
                  </Button>
                </Link>
              </div>
            )}

            {user && !user.currentSponsorId && (
              <Link
                className="ph-no-capture"
                href="/new/sponsor/"
                onClick={() => posthog.capture('get started_sponsor navbar')}
              >
                <Button variant="ghost" className="text-base text-brand-purple">
                  Get Started
                </Button>
              </Link>
            )}

            {user && !!user.currentSponsorId && (
              <Link
                className="ph-no-capture"
                href="/dashboard/listings/?open=1"
                onClick={() =>
                  posthog.capture('create a listing_sponsor navbar')
                }
              >
                <Button variant="ghost" className="text-base text-brand-purple">
                  Create a Listing
                </Button>
              </Link>
            )}

            <div className="flex flex-col">
              {NAV_LINKS?.map((navItem) => (
                <Link
                  key={navItem.label}
                  className="flex h-8 items-center py-2 text-lg font-medium text-slate-500 hover:text-slate-600 hover:no-underline lg:h-14 lg:text-sm"
                  href={navItem.link ?? '#'}
                >
                  {navItem.label}
                </Link>
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  };

  return (
    <div className="flex items-center justify-between border-b border-black/20 bg-white px-1 py-2 lg:hidden">
      <Button
        ref={btnRef}
        variant="ghost"
        size="sm"
        className="hover:bg-transparent"
        onClick={onDrawerOpen}
      >
        <Menu className="h-6 w-6 text-slate-500" />
      </Button>

      <MobileDrawer />

      <div className="absolute left-1/2 -translate-x-1/2">
        <Link
          href="/"
          className="flex items-center gap-2 hover:no-underline"
          onClick={() => {
            posthog.capture('homepage logo click_universal');
          }}
        >
          <img
            className="h-[1.3rem] cursor-pointer object-contain"
            alt="Superteam Earn"
            src="/assets/logo.svg"
          />
          <div className="h-6 w-px bg-slate-300" />
          <p className="text-sm font-semibold tracking-[1.5px] text-slate-500">
            SPONSORS
          </p>
        </Link>
      </div>

      {ready && authenticated && <UserMenu />}
      {ready && !authenticated && (
        <Link
          className="ph-no-capture"
          href="/new/sponsor/"
          onClick={() => posthog.capture('login_navbar')}
        >
          <Button variant="ghost" className="mr-2 text-base text-brand-purple">
            Login
          </Button>
        </Link>
      )}
    </div>
  );
};
