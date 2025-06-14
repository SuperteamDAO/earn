import { ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { usePostHog } from 'posthog-js/react';
import { useEffect } from 'react';

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
import { useDisclosure } from '@/hooks/use-disclosure';
import { useLogout, useUser } from '@/store/user';

import { EarnAvatar } from '@/features/talent/components/EarnAvatar';
import { EmailSettingsModal } from '@/features/talent/components/EmailSettingsModal';

export function UserMenu() {
  const router = useRouter();
  const posthog = usePostHog();
  const { user } = useUser();
  const logout = useLogout();
  const { isOpen, onClose, onOpen } = useDisclosure();

  useEffect(() => {
    const checkHashAndOpenModal = () => {
      const url = window.location.href;
      const hashIndex = url.indexOf('#');
      const afterHash = hashIndex !== -1 ? url.substring(hashIndex + 1) : '';
      const [hashValue, queryString] = afterHash.split('?');
      const hashHasEmail = hashValue === 'emailPreferences';
      const queryParams = new URLSearchParams(queryString);
      if (
        (hashHasEmail && queryParams.get('loginState') === 'signedIn') ||
        hashHasEmail
      ) {
        onOpen();
      }
    };

    checkHashAndOpenModal();
  }, [isOpen, onOpen]);

  const handleClose = async () => {
    console.log('close -', router);
    await router.replace(
      router.asPath.replace('#emailPreferences', ''),
      undefined,
      { shallow: true },
    );
    onClose();
  };

  const telegramBotLink =
    'https://t.me/SuperteamEarnNotificationsBot?start=earn';

  return (
    <>
      <EmailSettingsModal isOpen={isOpen} onClose={handleClose} />
      {user &&
        !user.currentSponsorId &&
        !user.isTalentFilled &&
        !router.pathname.startsWith('/new') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              posthog.capture('complete profile_nav bar');
              router.push('/new');
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
            <EarnAvatar className="size-7" id={user?.id} avatar={user?.photo} />
            <div className="flex items-center">
              <p className="text-sm font-medium tracking-tight text-slate-600">
                {user?.firstName ?? user?.email ?? 'New User'}
              </p>
            </div>
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
                <Link
                  href={`/t/${user?.username}`}
                  onClick={() => {
                    posthog.capture('profile_user menu');
                  }}
                  className="text-sm tracking-tight text-slate-500"
                >
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href={`/t/${user?.username}/edit`}
                  onClick={() => {
                    posthog.capture('edit profile_user menu');
                  }}
                  className="text-sm tracking-tight text-slate-500"
                >
                  Edit Profile
                </Link>
              </DropdownMenuItem>
            </>
          )}

          {!!user?.currentSponsorId && (
            <DropdownMenuItem asChild>
              <Link
                href="/dashboard/listings"
                onClick={() => {
                  posthog.capture('sponsor dashboard_user menu');
                }}
                className="text-sm tracking-tight text-slate-500"
              >
                Dashboard
              </Link>
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          {user?.role === 'GOD' && (
            <div>
              <DropdownMenuLabel className="-mb-2 text-xs font-medium text-slate-400">
                God Mode
              </DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link
                  href="/new/sponsor"
                  className="text-sm tracking-tight text-slate-500"
                >
                  Create New Sponsor
                </Link>
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

          <DropdownMenuItem asChild>
            <Link
              href={telegramBotLink}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Connect Telegram notifications bot"
              onClick={() => {
                posthog.capture('telegram notifications menu');
              }}
              className="text-sm tracking-tight text-slate-500"
            >
              Earn Alerts
            </Link>
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
              logout();
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
