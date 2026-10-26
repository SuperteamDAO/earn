'use client';

import { ChevronDown, ChevronUp } from 'lucide-react';
import dynamic from 'next/dynamic';
import { posthog } from 'posthog-js';
import React, { useState } from 'react';

import { SupportFormDialog } from '@/components/shared/SupportFormDialog';
import { Button } from '@/components/ui/button';
import { ExternalImage } from '@/components/ui/cloudinary-image';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { generateTelegramBotUrl } from '@/constants/Telegram';
import { useDisclosure } from '@/hooks/use-disclosure';
import { ResumingAccount } from '@/lib/auth/resume-session';
import { useViewer } from '@/lib/viewer';
import { cn } from '@/utils/cn';

import { HACKATHONS } from '@/features/hackathon/constants/hackathons';
import { EarnAvatar } from '@/features/talent/components/EarnAvatar';

import {
  CATEGORY_NAV_ITEMS,
  LISTING_NAV_ITEMS,
  renderLabel,
} from '../constants';
import { useLogout } from '../hooks/use-logout';
import { useShellNavigate } from './ShellLink';

const EmailSettingsModal = dynamic(() =>
  import('./EmailSettingsModal').then((mod) => mod.EmailSettingsModal),
);

interface MobileDrawerProps {
  isDrawerOpen: boolean;
  onDrawerClose: () => void;
  signIn: string;
  resuming: boolean;
}

interface NavItemProps {
  onClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  label: React.ReactNode;
  className?: string;
}

const NavItem = ({ onClick, label, className }: NavItemProps) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        'ph-no-capture flex cursor-pointer items-center rounded-lg p-2 text-slate-600 select-none hover:bg-slate-100',
        className,
      )}
    >
      {label}
    </div>
  );
};

export const MobileDrawer = ({
  isDrawerOpen,
  onDrawerClose,
  signIn,
  resuming,
}: MobileDrawerProps) => {
  const navigate = useShellNavigate();
  const [categoriesOpen, setCategoriesOpen] = useState(true);
  const [skillsOpen, setSkillsOpen] = useState(false);
  const logout = useLogout();

  const { isOpen, onClose, onOpen } = useDisclosure();

  const user = useViewer();

  const isLoggedIn = !!user;

  return (
    <Sheet open={isDrawerOpen} onOpenChange={onDrawerClose}>
      <SheetContent
        side="left"
        className="w-[300px] overflow-y-auto p-0 text-sm sm:w-[380px] sm:text-base"
        showCloseIcon={false}
        onOpenAutoFocus={() => false}
      >
        {/* Hidden element to prevent auto-focus */}
        <div tabIndex={-1} className="sr-only" />

        {isOpen && <EmailSettingsModal isOpen={isOpen} onClose={onClose} />}

        {isLoggedIn && (
          <div>
            <div
              className="flex items-center gap-1.5 px-4 py-3 select-none sm:gap-2 sm:py-4"
              onClick={() => {
                navigate(`/earn/t/${user?.username}/`);
                onDrawerClose();
              }}
            >
              <EarnAvatar
                className="size-8 sm:size-9"
                id={user?.id}
                avatar={user?.photo ?? undefined}
              />
              <p className="line-clamp-1 text-lg text-slate-600">
                {user?.firstName} {user?.lastName}
              </p>
            </div>
            <Separator />
          </div>
        )}

        <div className="px-4 py-3">
          {resuming && !user && (
            <div className="mb-3 ml-2">
              <ResumingAccount signIn={signIn} />
            </div>
          )}
          {!resuming && !user && (
            <div className="ph-no-capture mb-3 ml-2 flex items-center gap-3">
              {/* Plain <a>: sign-in is a Privy document with its own CSP. */}
              <a
                href={signIn}
                className="text-semibold cursor-pointer p-0 text-slate-600 hover:text-slate-900"
                onClick={() => {
                  posthog.capture('login_navbar');
                }}
              >
                Login
              </a>
              <Separator orientation="vertical" className="h-5 bg-slate-300" />
              <a
                href={signIn}
                className="text-semibold text-brand-purple hover:text-brand-purple-dark cursor-pointer"
                onClick={() => {
                  posthog.capture('signup_navbar');
                }}
              >
                Sign Up
              </a>
            </div>
          )}
          {user && !user.currentSponsorId && !user.isTalentFilled && (
            <Button
              variant="ghost"
              className="text-semibold text-brand-purple hover:text-brand-purple-dark cursor-pointer"
              onClick={() => {
                navigate('/earn/new/');
              }}
            >
              Complete your Profile
            </Button>
          )}
          {HACKATHONS?.map((hackathon) => (
            <NavItem
              key={hackathon.slug}
              label={
                <div className="relateive flex translate-x-1.75 items-center gap-2">
                  <ExternalImage
                    src={hackathon.logo}
                    alt={hackathon.label}
                    className="h-6 scale-100 p-1"
                  />
                </div>
              }
              onClick={() => {
                navigate(`/earn/hackathon/${hackathon.slug}/`);
              }}
            />
          ))}
          <div className="ph-no-capture flex flex-col">
            {isLoggedIn && user?.isTalentFilled && (
              <>
                <NavItem
                  label="Profile"
                  onClick={() => navigate(`/earn/t/${user?.username}/`)}
                />
                <NavItem
                  label="Edit Profile"
                  onClick={() => navigate(`/earn/t/${user?.username}/edit/`)}
                />
                <NavItem label="Email Preferences" onClick={onOpen} />
                <NavItem
                  label="Bookmarks"
                  onClick={() => {
                    posthog.capture('bookmarks_user menu');
                    navigate(`/earn/bookmarks/`);
                  }}
                />
              </>
            )}
            <Collapsible
              className="space-y-1"
              open={categoriesOpen}
              onOpenChange={setCategoriesOpen}
            >
              <CollapsibleTrigger
                tabIndex={-1}
                data-no-focus
                className={cn(
                  'flex w-full items-center justify-between rounded-lg p-2 text-slate-600 transition-colors focus:outline-none focus-visible:ring-0 focus-visible:outline-none',
                  'hover:bg-slate-100',
                  categoriesOpen && 'bg-slate-100',
                )}
              >
                <span>Browse Categories</span>
                {categoriesOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="pl-4">
                  {LISTING_NAV_ITEMS?.map((navItem) => {
                    return (
                      <NavItem
                        onClick={() => {
                          posthog.capture(navItem.posthog);
                          navigate(navItem.href);
                          onDrawerClose();
                        }}
                        key={navItem.label}
                        label={renderLabel(navItem)}
                      />
                    );
                  })}
                </div>
              </CollapsibleContent>
            </Collapsible>
            <Collapsible
              className="space-y-1"
              open={skillsOpen}
              onOpenChange={setSkillsOpen}
            >
              <CollapsibleTrigger
                tabIndex={-1}
                data-no-focus
                className={cn(
                  'flex w-full items-center justify-between rounded-lg p-2 text-slate-600 transition-colors focus:outline-none focus-visible:ring-0 focus-visible:outline-none',
                  'hover:bg-slate-100',
                  skillsOpen && 'bg-slate-100',
                )}
              >
                <span>Browse Skills</span>
                {skillsOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="pl-4">
                  {CATEGORY_NAV_ITEMS?.map((navItem) => {
                    return (
                      <NavItem
                        onClick={() => {
                          posthog.capture(navItem.posthog);
                          navigate(navItem.href);
                          onDrawerClose();
                        }}
                        key={navItem.label}
                        label={renderLabel(navItem)}
                      />
                    );
                  })}
                </div>
              </CollapsibleContent>
            </Collapsible>

            <NavItem
              label="Activity Feed"
              onClick={() => navigate(`/earn/feed/`)}
            />
            <SupportFormDialog>
              <NavItem
                label="Get Help"
                onClick={() => {
                  posthog.capture('get help_navbar');
                }}
              />
            </SupportFormDialog>
            {isLoggedIn && (
              <NavItem
                onClick={() => {
                  posthog.capture('telegram notifications_user menu');
                  window.open(generateTelegramBotUrl(user?.email), '_blank');
                }}
                label="Telegram Notifications"
              />
            )}
            {isLoggedIn && (
              <NavItem
                label="Logout"
                onClick={() => {
                  posthog.capture('logout_user menu');
                  void logout();
                }}
                className="text-red-500"
              />
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
