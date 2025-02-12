import { ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { usePostHog } from 'posthog-js/react';
import { useEffect } from 'react';

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

  const handleClose = () => {
    onClose();
    router.push(router.asPath, undefined, { shallow: true });
  };

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
            className="ph-no-capture hidden text-xs md:flex"
          >
            Complete your Profile
          </Button>
        )}
      <DropdownMenu>
        <DropdownMenuTrigger
          id="user menu"
          className="ph-no-capture rounded-lg border border-white bg-white px-2 py-1 transition-all duration-100 hover:bg-slate-100 focus:outline-hidden active:border-slate-300 active:bg-slate-200 data-[state=open]:bg-slate-100 md:px-2"
          onClick={() => {
            posthog.capture('clicked_user menu');
          }}
        >
          <div className="flex items-center gap-0.5 md:gap-1.5">
            <EarnAvatar
              className="h-7 w-7 md:h-8 md:w-8"
              id={user?.id}
              avatar={user?.photo}
            />
            <div className="hidden items-center md:flex">
              <p className="text-xs font-medium text-slate-600 sm:text-sm">
                {user?.firstName ?? user?.email ?? 'New User'}
              </p>
            </div>
            <ChevronDown className="hidden h-3 w-3 text-slate-400 md:block md:h-4 md:w-4" />
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
                  className="text-xs tracking-tight text-slate-500 sm:text-sm"
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
                  className="text-xs tracking-tight text-slate-500 sm:text-sm"
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
                className="hidden text-xs tracking-tight text-slate-500 sm:block sm:text-sm"
              >
                Sponsor Dashboard
              </Link>
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          {user?.role === 'GOD' && (
            <div className="hidden sm:block">
              <DropdownMenuLabel className="-mb-2 text-xs font-medium text-slate-400">
                God Mode
              </DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link
                  href="/new/sponsor"
                  className="text-xs tracking-tight text-slate-500 sm:text-sm"
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
              className="text-xs tracking-tight text-slate-500 sm:text-sm"
            >
              Email Preferences
            </DropdownMenuItem>
          )}

          <DropdownMenuItem
            onClick={() => {
              window.open('mailto:support@superteamearn.com', '_blank');
              posthog.capture('get help_user menu');
            }}
            className="text-xs tracking-tight text-slate-500 sm:text-sm"
          >
            Get Help
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => {
              posthog.capture('logout_user menu');
              logout();
            }}
            className="text-xs tracking-tight text-red-500 sm:text-sm"
          >
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
