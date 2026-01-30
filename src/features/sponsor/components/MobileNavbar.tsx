import { usePrivy } from '@privy-io/react-auth';
import { Menu } from 'lucide-react';
import Link from 'next/link';
import posthog from 'posthog-js';
import { useRef } from 'react';

import { Button } from '@/components/ui/button';
import { LocalImage } from '@/components/ui/local-image';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetClose, SheetContent } from '@/components/ui/sheet';
import { useDisclosure } from '@/hooks/use-disclosure';
import { useUser } from '@/store/user';

import { EarnAvatar } from '@/features/talent/components/EarnAvatar';

import { NAV_LINKS } from '../utils/constants';

const MobileSponsorDrawer = ({
  isDrawerOpen,
  onDrawerClose,
  ready,
  authenticated,
  user,
}: {
  isDrawerOpen: boolean;
  onDrawerClose: () => void;
  ready: boolean;
  authenticated: boolean;
  user: ReturnType<typeof useUser>['user'];
}) => {
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
                href="/earn/new/sponsor/"
                onClick={() => posthog.capture('login_navbar')}
              >
                <Button variant="ghost" className="text-base text-slate-500">
                  Login
                </Button>
              </Link>
              <Separator orientation="vertical" className="h-5 bg-slate-300" />
              <Link
                className="ph-no-capture"
                href="/earn/new/sponsor/"
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
              href="/earn/new/sponsor/"
              onClick={() => posthog.capture('get started_sponsor navbar')}
            >
              <Button variant="ghost" className="text-brand-purple text-base">
                Get Started
              </Button>
            </Link>
          )}

          {user && !!user.currentSponsorId && (
            <Link
              className="ph-no-capture"
              href="/earn/dashboard/listings/?open=1"
              onClick={() => posthog.capture('create a listing_sponsor navbar')}
            >
              <Button variant="outline" className="text-brand-purple text-base">
                Post for Free
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

export const MobileNavbar = () => {
  const {
    isOpen: isDrawerOpen,
    onOpen: onDrawerOpen,
    onClose: onDrawerClose,
  } = useDisclosure();

  const { authenticated, ready } = usePrivy();
  const { user } = useUser();

  const btnRef = useRef<HTMLButtonElement>(null);

  const openDrawer = () => {
    onDrawerOpen();
    posthog.capture('open_mobile nav');
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

      <MobileSponsorDrawer
        isDrawerOpen={isDrawerOpen}
        onDrawerClose={onDrawerClose}
        ready={ready}
        authenticated={authenticated}
        user={user}
      />

      <div className="absolute left-1/2 -translate-x-1/2">
        <Link
          href="/earn"
          className="flex items-center gap-2 hover:no-underline"
          onClick={() => {
            posthog.capture('homepage logo click_universal');
          }}
        >
          <LocalImage
            className="h-[1.3rem] cursor-pointer object-contain"
            alt="Superteam Earn"
            src="/assets/logo.svg"
            loading="eager"
          />
          <div className="h-6 w-[1.5px] rotate-10 bg-slate-300" />
          <p className="text-sm font-medium tracking-[1.5px] text-slate-400">
            SPONSORS
          </p>
        </Link>
      </div>

      {ready && authenticated && (
        <div onClick={openDrawer} className="relative ml-1 cursor-pointer">
          {ready && authenticated ? (
            <>
              <EarnAvatar
                className="size-8"
                id={user?.id}
                avatar={user?.photo}
              />
            </>
          ) : (
            <Menu className="size-6 text-slate-500" />
          )}
        </div>
      )}
      {ready && !authenticated && (
        <Link
          className="ph-no-capture"
          href="/earn/new/sponsor/"
          onClick={() => posthog.capture('login_navbar')}
        >
          <Button variant="ghost" className="text-brand-purple mr-2 text-base">
            Login
          </Button>
        </Link>
      )}
    </div>
  );
};
