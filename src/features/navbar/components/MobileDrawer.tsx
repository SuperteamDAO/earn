import { usePrivy } from '@privy-io/react-auth';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useRouter } from 'next/router';
import { usePostHog } from 'posthog-js/react';
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
import { useDisclosure } from '@/hooks/use-disclosure';
import { useLogout, useUser } from '@/store/user';
import { cn } from '@/utils/cn';
import { getTelegramBotURL } from '@/utils/getTelegramBotURL';

import { HACKATHONS } from '@/features/hackathon/constants/hackathons';
import { EarnAvatar } from '@/features/talent/components/EarnAvatar';
import { EmailSettingsModal } from '@/features/talent/components/EmailSettingsModal';

import {
  CATEGORY_NAV_ITEMS,
  LISTING_NAV_ITEMS,
  renderLabel,
} from '../constants';

interface MobileDrawerProps {
  isDrawerOpen: boolean;
  onDrawerClose: () => void;
  onLoginOpen: () => void;
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
  onLoginOpen,
}: MobileDrawerProps) => {
  const router = useRouter();
  const { authenticated, ready } = usePrivy();
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [skillsOpen, setSkillsOpen] = useState(false);
  const logout = useLogout();

  const { isOpen, onClose, onOpen } = useDisclosure();

  const { user } = useUser();

  const posthog = usePostHog();

  const isLoggedIn = !!user && authenticated && ready;

  return (
    <Sheet open={isDrawerOpen} onOpenChange={onDrawerClose}>
      <SheetContent
        side="left"
        className="w-[300px] overflow-y-auto p-0 text-sm sm:w-[380px] sm:text-base"
        showCloseIcon={false}
      >
        <EmailSettingsModal isOpen={isOpen} onClose={onClose} />

        {isLoggedIn && (
          <div>
            <div
              className="flex items-center gap-1.5 px-4 py-3 select-none sm:gap-2 sm:py-4"
              onClick={() => {
                router.push(`/t/${user?.username}`);
                onDrawerClose();
              }}
            >
              <EarnAvatar
                className="size-8 sm:size-9"
                id={user?.id}
                avatar={user?.photo}
              />
              <p className="line-clamp-1 text-lg text-slate-600">
                {user?.firstName} {user?.lastName}
              </p>
            </div>
            <Separator />
          </div>
        )}

        <div className="px-4 py-3">
          {ready && !authenticated && (
            <div className="ph-no-capture mb-3 ml-2 flex items-center gap-3">
              <div
                className="text-semibold cursor-pointer p-0 text-slate-600 hover:text-slate-900"
                onClick={() => {
                  posthog.capture('login_navbar');
                  onDrawerClose();
                  onLoginOpen();
                }}
              >
                Login
              </div>
              <Separator orientation="vertical" className="h-5 bg-slate-300" />
              <div
                className="text-semibold text-brand-purple hover:text-brand-purple-dark cursor-pointer"
                onClick={() => {
                  posthog.capture('signup_navbar');
                  onDrawerClose();
                  onLoginOpen();
                }}
              >
                Sign Up
              </div>
            </div>
          )}

          {user && !user.currentSponsorId && !user.isTalentFilled && (
            <Button
              variant="ghost"
              className="text-semibold text-brand-purple hover:text-brand-purple-dark cursor-pointer"
              onClick={() => {
                router.push('/new');
              }}
            >
              Complete your Profile
            </Button>
          )}
          <div className="ph-no-capture flex flex-col">
            {isLoggedIn && (
              <>
                <NavItem
                  label="Profile"
                  onClick={() => router.push(`/t/${user?.username}`)}
                />
                <NavItem
                  label="Edit Profile"
                  onClick={() => router.push(`/t/${user?.username}/edit`)}
                />
                <NavItem label="Email Preferences" onClick={onOpen} />
              </>
            )}
            <Collapsible
              className="space-y-1"
              open={categoriesOpen}
              onOpenChange={setCategoriesOpen}
            >
              <CollapsibleTrigger
                className={cn(
                  'flex w-full items-center justify-between rounded-lg p-2 text-slate-600 transition-colors',
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
                          router.push(navItem.href);
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
                className={cn(
                  'flex w-full items-center justify-between rounded-lg p-2 text-slate-600 transition-colors',
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
                          router.push(navItem.href);
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
            <div>
              <NavItem label="Live Hackathons" onClick={() => {}} />
              <div className="ml-4">
                {HACKATHONS?.map((hackathon) => (
                  <NavItem
                    key={hackathon.slug}
                    label={
                      <div className="flex items-center gap-2">
                        <ExternalImage
                          src={hackathon.logo}
                          alt={hackathon.label}
                          className="h-4"
                        />
                      </div>
                    }
                    onClick={() => {
                      router.push(`/hackathon/${hackathon.slug}`);
                    }}
                  />
                ))}
              </div>
            </div>
            <NavItem
              label="Activity Feed"
              onClick={() => router.push(`/feed`)}
            />
            <NavItem
              label="Leaderboard"
              onClick={() => router.push(`/leaderboard`)}
            />
            <NavItem
              label="Telegram Notifications"
              onClick={() => router.push(getTelegramBotURL(user))}
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
                label="Logout"
                onClick={() => {
                  posthog.capture('logout_user menu');
                  logout();
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
