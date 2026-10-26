'use client';

import { ChevronDown } from 'lucide-react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { posthog } from 'posthog-js';
import { useEffect, useSyncExternalStore } from 'react';

import { SupportFormDialog } from '@/components/shared/SupportFormDialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { generateTelegramBotUrl } from '@/constants/Telegram';
import { useDisclosure } from '@/hooks/use-disclosure';
import { useViewer } from '@/lib/viewer';

import { EarnAvatar } from '@/features/talent/components/EarnAvatar';

import { useLogout } from '../hooks/use-logout';
import { ShellLink, useShellNavigate } from './ShellLink';

const EmailSettingsModal = dynamic(() =>
  import('./EmailSettingsModal').then((mod) => mod.EmailSettingsModal),
);

// Whether they've opened Telegram Alerts before (a dot until they do).
// The server can't see localStorage: it renders them as seen.
const TELEGRAM_SEEN = 'telegram-alerts-shown';
const seenListeners = new Set<() => void>();
const subscribeSeen = (listener: () => void) => {
  seenListeners.add(listener);
  window.addEventListener('storage', listener);
  return () => {
    seenListeners.delete(listener);
    window.removeEventListener('storage', listener);
  };
};

const markSeen = () => {
  localStorage.setItem(TELEGRAM_SEEN, 'true');
  for (const listener of seenListeners) listener();
};

export function useSeenTelegramAlerts() {
  const seen = useSyncExternalStore(
    subscribeSeen,
    () => localStorage.getItem(TELEGRAM_SEEN) === 'true',
    () => true,
  );
  return [seen, markSeen] as const;
}

export function UserMenu() {
  const navigate = useShellNavigate();
  const pathname = usePathname() ?? '';

  const user = useViewer();
  const logout = useLogout();
  const { isOpen, onClose, onOpen } = useDisclosure();
  const [hasSeenTelegramAlerts, markTelegramAlertsSeen] =
    useSeenTelegramAlerts();

  useEffect(() => {
    const checkHashAndOpenModal = () => {
      const url = window.location.href;
      const hashIndex = url.indexOf('#');
      const afterHash = hashIndex !== -1 ? url.substring(hashIndex + 1) : '';
      const [hashValue] = afterHash.split('?');
      const hashHasEmail = hashValue === 'emailPreferences';
      if (hashHasEmail) {
        onOpen();
      }
    };

    checkHashAndOpenModal();
  }, [onOpen]);

  const handleClose = () => {
    if (window.location.hash === '#emailPreferences') {
      window.history.replaceState(
        window.history.state,
        '',
        window.location.pathname + window.location.search,
      );
    }
    onClose();
  };

  const handleTelegramAlertsClick = () => {
    markTelegramAlertsSeen();
    posthog.capture('telegram notifications_user menu');
  };

  return (
    <>
      {isOpen && <EmailSettingsModal isOpen={isOpen} onClose={handleClose} />}
      {user &&
        !user.currentSponsorId &&
        !user.isTalentFilled &&
        !pathname.startsWith('/earn/new') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              posthog.capture('complete profile_nav bar');
              navigate('/earn/new/');
            }}
            className="ph-no-capture flex text-xs"
          >
            Complete your Profile
          </Button>
        )}
      <DropdownMenu>
        <DropdownMenuTrigger
          id="user menu"
          className="ph-no-capture rounded-lg border border-white px-2 py-1 transition-all duration-100 hover:bg-slate-100 focus:outline-hidden active:border-slate-300 active:bg-slate-200 data-[state=open]:bg-slate-100"
          onClick={() => {
            posthog.capture('clicked_user menu');
          }}
        >
          <div className="flex items-center gap-1.5">
            <EarnAvatar
              className="size-7"
              id={user?.id}
              avatar={user?.photo ?? undefined}
            />
            <div className="flex items-center">
              <p className="text-sm font-medium tracking-tight text-slate-600">
                {user?.firstName ?? user?.email ?? ''}
              </p>
            </div>
            {!hasSeenTelegramAlerts && (
              <div className="block h-1.5 w-1.5 rounded-full bg-sky-400" />
            )}
            <ChevronDown className="block size-4 text-slate-400" />
          </div>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          className="ph-no-capture px-0 font-medium"
          align="start"
        >
          {user?.isTalentFilled && (
            <>
              <DropdownMenuItem asChild>
                <ShellLink
                  href={`/earn/t/${user?.username}/`}
                  onClick={() => {
                    posthog.capture('profile_user menu');
                  }}
                  className="text-sm tracking-tight text-slate-500"
                >
                  Profile
                </ShellLink>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <ShellLink
                  href={`/earn/t/${user?.username}/edit/`}
                  onClick={() => {
                    posthog.capture('edit profile_user menu');
                  }}
                  className="text-sm tracking-tight text-slate-500"
                >
                  Edit Profile
                </ShellLink>
              </DropdownMenuItem>
            </>
          )}

          {!!user?.currentSponsorId && (
            <DropdownMenuItem asChild>
              <ShellLink
                href="/earn/dashboard/listings/"
                onClick={() => {
                  posthog.capture('sponsor dashboard_user menu');
                }}
                className="text-sm tracking-tight text-slate-500"
              >
                Dashboard
              </ShellLink>
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          {user?.role === 'GOD' && (
            <div>
              <DropdownMenuLabel className="-mb-2 text-xs font-medium text-slate-400">
                God Mode
              </DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <ShellLink
                  href="/earn/new/sponsor/"
                  className="text-sm tracking-tight text-slate-500"
                >
                  Create New Sponsor
                </ShellLink>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </div>
          )}

          {(user?.isTalentFilled || !!user?.currentSponsorId) && (
            <DropdownMenuItem
              onClick={() => {
                onOpen();
                posthog.capture('email preferences_user menu');
              }}
              className="text-sm tracking-tight text-slate-500"
            >
              Email Preferences
            </DropdownMenuItem>
          )}

          {user?.isTalentFilled && (
            <DropdownMenuItem asChild>
              <ShellLink
                href="/earn/bookmarks/"
                onClick={() => {
                  posthog.capture('bookmarks_user menu');
                }}
                className="text-sm tracking-tight text-slate-500"
              >
                Bookmarks
              </ShellLink>
            </DropdownMenuItem>
          )}

          <DropdownMenuItem asChild>
            <ShellLink
              href={generateTelegramBotUrl(user?.email)}
              target="_blank"
              onClick={handleTelegramAlertsClick}
              className="text-sm tracking-tight text-slate-500"
            >
              <div className="flex items-center gap-2">
                <span>Telegram Alerts</span>
                {!hasSeenTelegramAlerts && (
                  <div className="block h-1.5 w-1.5 rounded-full bg-sky-400" />
                )}
              </div>
            </ShellLink>
          </DropdownMenuItem>

          <SupportFormDialog>
            <DropdownMenuItem
              className="text-sm tracking-tight text-slate-500"
              onSelect={(e) => {
                e.preventDefault();
                posthog.capture('get help_user menu');
              }}
            >
              Get Help
            </DropdownMenuItem>
          </SupportFormDialog>

          <DropdownMenuItem
            onClick={() => {
              posthog.capture('logout_user menu');
              void logout();
            }}
            className="text-sm tracking-tight text-red-500"
          >
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
