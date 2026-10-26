'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';

import { renewSession } from './session-renewal';

// Rendered again signed in, this goes away; still here this long after a
// renewal, the server didn't take the renewed session.
const STUCK_MS = 10_000;

// Renews a lapsed session where the visitor is, then renders the page again
// signed in. True once it turns out that can't happen.
function useResume(): boolean {
  const router = useRouter();
  const [ended, setEnded] = useState(false);
  useEffect(() => {
    let live = true;
    let stuck: ReturnType<typeof setTimeout> | undefined;
    void renewSession().then((renewal) => {
      if (!live) return;
      if (renewal.kind !== 'renewed') {
        setEnded(true);
        return;
      }
      router.refresh();
      stuck = setTimeout(() => setEnded(true), STUCK_MS);
    });
    return () => {
      live = false;
      clearTimeout(stuck);
    };
  }, [router]);
  return ended;
}

// The header's corner while a lapsed session renews: where their photo goes,
// or Sign in if the session has ended.
export function ResumingAccount({ signIn }: { signIn: string }) {
  const ended = useResume();
  if (ended) {
    return (
      // Plain <a>: sign-in is a Privy document with its own CSP.
      <Button asChild size="sm" className="ph-no-capture">
        <a href={signIn}>Sign in</a>
      </Button>
    );
  }
  return (
    <span
      role="status"
      aria-label="Signing you in"
      className="size-8 animate-pulse rounded-full bg-slate-200"
    />
  );
}

// A page that needs them signed in, while their lapsed session renews. If
// the session has ended, the page does need them to sign in again.
export function ResumingPage({ signIn }: { signIn: string }) {
  const ended = useResume();
  useEffect(() => {
    if (ended) window.location.assign(signIn);
  }, [ended, signIn]);
  return (
    <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-5 sm:pt-10" aria-busy>
      <div className="h-[50vh] animate-pulse rounded-2xl bg-slate-100" />
    </main>
  );
}
