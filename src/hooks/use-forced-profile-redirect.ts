'use client';

import { atom, useAtom } from 'jotai';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { toast } from 'sonner';

import type { useUser } from '@/store/user';

import { loginEventAtom } from '@/features/auth/atoms';

const forcedRedirectedAtom = atom(false);

type User = ReturnType<typeof useUser>['user'];

interface UseForcedProfileRedirectProps {
  readonly user: User;
  readonly isUserLoading: boolean;
}

export const useForcedProfileRedirect = ({
  user,
  isUserLoading,
}: UseForcedProfileRedirectProps): void => {
  const router = useRouter();
  const { pathname, asPath } = router;
  const [forcedRedirected, setForcedRedirected] = useAtom(forcedRedirectedAtom);
  const [loginEvent, setLoginEvent] = useAtom(loginEventAtom);

  useEffect(() => {
    let redirectTimeout: NodeJS.Timeout | undefined;

    const isExcludedPath =
      pathname.startsWith('/new') ||
      pathname.startsWith('/sponsor') ||
      pathname.startsWith('/signup');

    // guard clauses: exit early if a redirect is not needed.
    if (
      isUserLoading ||
      !user ||
      user.isTalentFilled ||
      user.currentSponsorId ||
      forcedRedirected ||
      isExcludedPath
    ) {
      return;
    }

    const performRedirect = (wait: number) => {
      if (forcedRedirected) return;

      setForcedRedirected(true);
      setLoginEvent('idle');

      const redirectAction = () => {
        router.push({
          pathname: '/new',
          query: { type: 'forced', originUrl: asPath },
        });
      };

      if (wait > 0) {
        toast.info('Finish your profile to continue browsing.', {
          description: `You will be redirected in ~${Math.floor(
            wait / 1000,
          ).toFixed(0)} seconds.`,
          duration: wait,
        });
      }

      redirectTimeout = setTimeout(redirectAction, wait);
    };

    // a fresh login is a user action, so we can redirect immediately.
    if (loginEvent === 'fresh_login') {
      performRedirect(0);
      return;
    }

    // for returning users, defer the check to protect core web vitals.
    const deferredCheck = () => performRedirect(5000);

    if (document.readyState === 'complete') {
      setTimeout(deferredCheck, 100);
    } else {
      window.addEventListener('load', deferredCheck, { once: true });
    }

    return () => {
      if (redirectTimeout) {
        clearTimeout(redirectTimeout);
      }
      window.removeEventListener('load', deferredCheck);
    };
  }, [
    user,
    isUserLoading,
    pathname,
    asPath,
    router,
    loginEvent,
    setLoginEvent,
    forcedRedirected,
    setForcedRedirected,
  ]);
};
