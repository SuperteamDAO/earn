'use client';

import { atom, useAtom } from 'jotai';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { toast } from 'sonner';

import type { useUser } from '@/store/user';

import { loginEventAtom } from '@/features/auth/atoms';

const forcedRedirectedAtom = atom(false);

// useUser mounts this hook once per caller, so every eligible instance shares
// one pending redirect: the first to subscribe schedules it and the last to
// clean up cancels it. Keeping it outside React state means scheduling it does
// not re-run, and so cancel, the effect that scheduled it.
let subscribers = 0;
let cancelPendingRedirect: (() => void) | undefined;

const scheduleRedirect = (redirect: () => void, wait: number) => {
  // a fresh login is a user action, so we can redirect immediately.
  if (wait === 0) {
    const redirectTimeout = setTimeout(redirect, 0);
    return () => clearTimeout(redirectTimeout);
  }

  let deferTimeout: NodeJS.Timeout | undefined;
  let redirectTimeout: NodeJS.Timeout | undefined;
  let toastId: string | number | undefined;

  const deferredCheck = () => {
    toastId = toast.info('Finish your profile to continue browsing.', {
      description: `You will be redirected in ~${Math.floor(
        wait / 1000,
      ).toFixed(0)} seconds.`,
      duration: wait,
    });
    redirectTimeout = setTimeout(redirect, wait);
  };

  // for returning users, defer the check to protect core web vitals.
  if (document.readyState === 'complete') {
    deferTimeout = setTimeout(deferredCheck, 100);
  } else {
    window.addEventListener('load', deferredCheck, { once: true });
  }

  return () => {
    clearTimeout(deferTimeout);
    clearTimeout(redirectTimeout);
    window.removeEventListener('load', deferredCheck);
    if (toastId !== undefined) toast.dismiss(toastId);
  };
};

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
    const isExcludedPath =
      pathname.startsWith('/earn/new') ||
      pathname.startsWith('/earn/sponsor') ||
      pathname.startsWith('/earn/signup') ||
      pathname.startsWith('/earn/r/');

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

    // flip the state only once the redirect fires: flipping it earlier
    // re-runs this effect, whose cleanup would cancel the redirect.
    const redirect = () => {
      setForcedRedirected(true);
      setLoginEvent('idle');
      router.push({
        pathname: '/earn/new',
        query: { type: 'forced', originUrl: asPath },
      });
    };

    subscribers += 1;
    if (subscribers === 1) {
      cancelPendingRedirect = scheduleRedirect(
        redirect,
        loginEvent === 'fresh_login' ? 0 : 5000,
      );
    }

    return () => {
      subscribers -= 1;
      if (subscribers === 0) {
        cancelPendingRedirect?.();
        cancelPendingRedirect = undefined;
      }
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
