import { usePrivy } from '@privy-io/react-auth';
import { Menu } from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import posthog from 'posthog-js';
import React from 'react';
import { IoWalletOutline } from 'react-icons/io5';

import { Button } from '@/components/ui/button';
import { LocalImage } from '@/components/ui/local-image';
import { useDisclosure } from '@/hooks/use-disclosure';
import { useCreditBalance } from '@/store/credit';
import { useUser } from '@/store/user';
import { formatNumberWithSuffix } from '@/utils/formatNumberWithSuffix';

import { CreditIcon } from '@/features/credits/icon/credit';
import { EarnAvatar } from '@/features/talent/components/EarnAvatar';

interface Props {
  onLoginOpen: () => void;
  onWalletOpen: () => void;
  onCreditOpen: () => void;
  walletBalance: number;
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

  const { user, isLoading } = useUser();
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
          <div className="flex items-center gap-0">
            <div onClick={openDrawer} className="relative ml-1 cursor-pointer">
              {ready && authenticated && !isLoading ? (
                <>
                  <EarnAvatar
                    className="size-8"
                    id={user?.id}
                    avatar={user?.photo}
                  />
                  <div className="absolute -right-2 -bottom-0.5 flex flex-col gap-[2px] rounded-full bg-white px-[5px] py-1.5">
                    <div className="w-2.5 border-[0.5px] border-slate-400" />
                    <div className="w-2.5 border-[0.5px] border-slate-400" />
                    <div className="w-2.5 border-[0.5px] border-slate-400" />
                  </div>
                </>
              ) : (
                <Menu className="size-6 text-slate-500" />
              )}
            </div>
          </div>

          <div className="absolute left-1/2 -translate-x-1/2">
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
                <div className="relative mr-2">
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
