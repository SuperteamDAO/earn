'use client';

import { Menu } from 'lucide-react';
import dynamic from 'next/dynamic';
import { posthog } from 'posthog-js';

import { Button } from '@/components/ui/button';
import { LocalImage } from '@/components/ui/local-image';
import { useDisclosure } from '@/hooks/use-disclosure';
import { ResumingAccount } from '@/lib/auth/resume-session';
import { useViewer } from '@/lib/viewer';
import { cn } from '@/utils/cn';

import { CreditIcon } from '@/features/credits/icon/credit';

import { ShellLink } from './ShellLink';

interface Props {
  signIn: string;
  resuming: boolean;
  creditBalance: number;
  onCreditOpen: () => void;
}

const MobileDrawer = dynamic(
  () => import('./MobileDrawer').then((mod) => mod.MobileDrawer),
  {
    ssr: false,
  },
);

export const MobileNavbar = ({
  signIn,
  resuming,
  creditBalance,
  onCreditOpen,
}: Props) => {
  const {
    isOpen: isDrawerOpen,
    onOpen: onDrawerOpen,
    onClose: onDrawerClose,
  } = useDisclosure();

  const user = useViewer();
  const authenticated = !!user;

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
      <div className="sticky top-0 z-50">
        <div className="flex min-h-12 items-center justify-between border-b border-black/20 bg-white px-1 py-1 lg:hidden">
          <div className="flex items-center gap-3">
            <div onClick={openDrawer} className="ml-1 cursor-pointer">
              <Menu className="size-5 text-gray-400" />
            </div>
            <ShellLink
              href="/earn/"
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
            </ShellLink>
          </div>

          <MobileDrawer
            isDrawerOpen={isDrawerOpen}
            onDrawerClose={onDrawerClose}
            signIn={signIn}
            resuming={resuming}
          />

          <div className="flex items-center gap-1">
            {authenticated && user?.isTalentFilled && (
              <div className="flex items-center gap-1">
                <div className="relative">
                  <div
                    className="flex cursor-pointer items-center gap-1 rounded-md px-2 py-1.5 text-slate-500 transition-all duration-100 hover:bg-slate-100 hover:text-slate-700 md:gap-2"
                    onClick={openCreditDrawer}
                  >
                    <CreditIcon
                      className={cn('size-4.5', 'text-brand-purple')}
                    />
                    <p className="text-sm font-medium">{creditBalance}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          {resuming && !authenticated && (
            <div className="mr-2">
              <ResumingAccount signIn={signIn} />
            </div>
          )}
          {!authenticated && !resuming && (
            // Plain <a>: sign-in is a Privy document with its own CSP.
            <Button
              variant="ghost"
              className="ph-no-capture text-brand-purple mr-2 text-base"
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
          )}
        </div>
      </div>
    </>
  );
};
