import { usePrivy } from '@privy-io/react-auth';
import { Gift, Menu } from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import posthog from 'posthog-js';
import React from 'react';

import { Button } from '@/components/ui/button';
import { LocalImage } from '@/components/ui/local-image';
import { useDisclosure } from '@/hooks/use-disclosure';
import { useCreditBalance } from '@/store/credit';
import { useUser } from '@/store/user';

import { CreditIcon } from '@/features/credits/icon/credit';

interface Props {
  onLoginOpen: () => void;
  onCreditOpen: () => void;
  onReferralOpen: () => void;
}

// const AnnouncementBar = dynamic(() =>
//   import('@/features/navbar').then((mod) => mod.AnnouncementBar),
// );

const MobileDrawer = dynamic(
  () => import('./MobileDrawer').then((mod) => mod.MobileDrawer),
  {
    ssr: false,
  },
);

export const MobileNavbar = ({
  onLoginOpen,
  onCreditOpen,
  onReferralOpen,
}: Props) => {
  const {
    isOpen: isDrawerOpen,
    onOpen: onDrawerOpen,
    onClose: onDrawerClose,
  } = useDisclosure();

  const { authenticated, ready } = usePrivy();

  const { user } = useUser();
  const { creditBalance } = useCreditBalance();

  const openCreditDrawer = () => {
    posthog.capture('open_credits');
    onCreditOpen();
  };

  const openDrawer = () => {
    onDrawerOpen();
    posthog.capture('open_mobile nav');
  };

  return (
    <>
      {/* {router.pathname === '/' && <AnnouncementBar />} */}
      <div className="sticky top-0 z-50">
        <div className="flex min-h-12 items-center justify-between border-b border-black/20 bg-white px-1 py-1 lg:hidden">
          <div className="flex items-center gap-3">
            <div onClick={openDrawer} className="ml-1 cursor-pointer">
              <Menu className="size-5 text-gray-400" />
            </div>
            <Link
              href="/"
              className="flex items-center hover:no-underline"
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
            </Link>
          </div>

          <MobileDrawer
            isDrawerOpen={isDrawerOpen}
            onDrawerClose={onDrawerClose}
            onLoginOpen={onLoginOpen}
          />

          <div className="flex items-center gap-1">
            {ready && authenticated && user?.isTalentFilled && (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-brand-purple hover:text-brand-purple bg-indigo-50 text-xs font-semibold hover:bg-indigo-100"
                  onClick={onReferralOpen}
                >
                  <Gift />
                  <span>Free Credits</span>
                </Button>
                <div className="relative">
                  <div
                    className="flex cursor-pointer items-center gap-1 rounded-md px-2 py-1.5 text-slate-500 transition-all duration-100 hover:bg-slate-100 hover:text-slate-700 md:gap-2"
                    onClick={openCreditDrawer}
                  >
                    <CreditIcon className="text-brand-purple size-4.5" />
                    <p className="text-sm font-medium">{creditBalance}</p>
                  </div>
                </div>
              </div>
            )}
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
    </>
  );
};
