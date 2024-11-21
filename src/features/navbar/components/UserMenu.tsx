import { ChevronDown } from 'lucide-react';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
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
import { EarnAvatar, EmailSettingsModal } from '@/features/talent';
import { useDisclosure } from '@/hooks/use-disclosure';
import { useLogout, useUser } from '@/store/user';

export function UserMenu() {
  const router = useRouter();
  const posthog = usePostHog();
  const { user } = useUser();
  const logout = useLogout();
  const { data: session } = useSession();
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
      {user && !user.currentSponsorId && !user.isTalentFilled && (
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
          className="ph-no-capture rounded-md border border-white bg-white px-0.5 py-1 hover:bg-slate-100 focus:outline-none active:border-slate-300 active:bg-slate-200 data-[state=open]:bg-slate-100 md:px-2"
          onClick={() => {
            posthog.capture('clicked_user menu');
          }}
        >
          <div className="flex items-center">
            <EarnAvatar id={user?.id} avatar={user?.photo} />
            <div className="ml-2 hidden items-center md:flex">
              <p className="text-sm font-medium text-slate-600">
                {user?.firstName ?? 'New User'}
              </p>
            </div>
            <ChevronDown className="ml-2 h-4 w-4 text-slate-400 md:h-5 md:w-5" />
          </div>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="ph-no-capture" align="start">
          {user?.isTalentFilled && (
            <>
              <DropdownMenuItem asChild>
                <NextLink
                  href={`/t/${user?.username}`}
                  onClick={() => {
                    posthog.capture('profile_user menu');
                  }}
                  className="text-sm font-semibold text-slate-500"
                >
                  Profile
                </NextLink>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <NextLink
                  href={`/t/${user?.username}/edit`}
                  onClick={() => {
                    posthog.capture('edit profile_user menu');
                  }}
                  className="text-sm font-semibold text-slate-500"
                >
                  Edit Profile
                </NextLink>
              </DropdownMenuItem>
            </>
          )}

          {!!user?.currentSponsorId && (
            <DropdownMenuItem asChild>
              <NextLink
                href="/dashboard/listings"
                onClick={() => {
                  posthog.capture('sponsor dashboard_user menu');
                }}
                className="hidden text-sm font-semibold text-slate-500 sm:block"
              >
                Sponsor Dashboard
              </NextLink>
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          {session?.user?.role === 'GOD' && (
            <div className="hidden sm:block">
              <DropdownMenuLabel className="-mb-2 text-xs font-medium text-slate-400">
                God Mode
              </DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <NextLink
                  href="/new/sponsor"
                  className="text-sm font-semibold text-slate-500"
                >
                  Create New Sponsor
                </NextLink>
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
              className="text-sm font-semibold text-slate-500"
            >
              Email Preferences
            </DropdownMenuItem>
          )}

          <DropdownMenuItem
            onClick={() => {
              window.open('mailto:support@superteamearn.com', '_blank');
              posthog.capture('get help_user menu');
            }}
            className="text-sm font-semibold text-slate-500"
          >
            Get Help
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => {
              posthog.capture('logout_user menu');
              logout();
            }}
            className="text-sm font-semibold text-red-500"
          >
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
