'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { renewSession } from '@/lib/auth/session-renewal';

// Earn's navbar waited for Privy to be `ready`. Here the server knows who is
// signed in, unless a lapsed session can be renewed (`resuming`): then it
// renews in place and the page renders again signed in. Not ready until
// that settles, so the navbar keeps showing Earn's skeleton meanwhile.
export function useSessionReady(resuming: boolean): boolean {
  const router = useRouter();
  const [ended, setEnded] = useState(false);
  useEffect(() => {
    if (!resuming) return undefined;
    let live = true;
    void renewSession().then((renewal) => {
      if (!live) return;
      if (renewal.kind === 'renewed') router.refresh();
      else setEnded(true);
    });
    return () => {
      live = false;
    };
  }, [resuming, router]);
  return !resuming || ended;
}
