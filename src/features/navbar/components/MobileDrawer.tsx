import { usePrivy } from '@privy-io/react-auth';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { usePostHog } from 'posthog-js/react';
import React from 'react';

import { Button } from '@/components/ui/button';
import { ExternalImage } from '@/components/ui/cloudinary-image';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetClose, SheetContent } from '@/components/ui/sheet';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';

import {
  CATEGORY_NAV_ITEMS,
  LISTING_NAV_ITEMS,
  renderLabel,
} from '../constants';
import { NavLink } from './NavLink';

interface MobileDrawerProps {
  isDrawerOpen: boolean;
  onDrawerClose: () => void;
  onLoginOpen: () => void;
}

export const MobileDrawer = ({
  isDrawerOpen,
  onDrawerClose,
  onLoginOpen,
}: MobileDrawerProps) => {
  const router = useRouter();
  const { authenticated, ready } = usePrivy();

  const { user } = useUser();

  const posthog = usePostHog();
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
              <Separator orientation="vertical" className="h-5 bg-slate-300" />
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
