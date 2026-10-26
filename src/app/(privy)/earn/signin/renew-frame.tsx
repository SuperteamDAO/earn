'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useEffect } from 'react';

import { RENEWAL, type RenewalMessage } from '@/lib/renewal';

const tell = (outcome: RenewalMessage['outcome']) =>
  window.parent.postMessage(
    { type: RENEWAL, outcome } satisfies RenewalMessage,
    window.location.origin,
  );

// /earn/signin/?renew=1, loaded by a public page in a hidden frame (see
// src/lib/auth/session-renewal.ts). Privy trades its refresh token for a new
// access token every time it loads, so the token is new however early the
// page asks; the server then reissues Earn's own session cookie from it.
// When Privy ends up with no session, the cookies are cleared and the page
// shows them signed out. That's no session stored, or Privy's server saying
// to clear it: revoked, expired, or a refresh token already used. Refresh
// tokens work once, which is why frames in different tabs take turns. A
// refresh that errors never makes Privy ready, so the page times out and
// nothing is cleared.
export function RenewFrame() {
  const { ready, authenticated, getAccessToken } = usePrivy();

  useEffect(() => {
    // Only ever a frame of Earn's own pages.
    if (window.parent === window) {
      window.location.replace('/earn/');
      return;
    }
    if (!ready) return;
    if (!authenticated) {
      void fetch('/earn/sign-out/', { method: 'POST' })
        .catch(() => null)
        .then(() => tell('signed-out'));
      return;
    }
    getAccessToken()
      .then((token) =>
        token
          ? fetch('/earn/session/', { method: 'POST' }).then(
              (response) => response.ok,
            )
          : false,
      )
      .then(
        (renewed) => tell(renewed ? 'renewed' : 'failed'),
        () => tell('failed'),
      );
  }, [ready, authenticated, getAccessToken]);

  return null;
}
