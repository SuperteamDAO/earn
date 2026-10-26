'use client';

import { posthog } from 'posthog-js';

import { signOut } from '@/lib/auth/sign-out';

// Earn's logout: end the session (through /earn/signin, where Privy's SDK
// lives), forget the analytics identity, and load the page again signed
// out.
export function useLogout() {
  return async () => {
    await signOut();
    // oxlint-disable-next-line eslint/no-underscore-dangle -- PostHog's own API
    if (posthog._isIdentified()) posthog.reset();
    window.location.reload();
  };
}
