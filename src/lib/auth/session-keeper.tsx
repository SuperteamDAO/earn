'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { CONFIRM_MS, SETTLE_MS, retryDelay } from '@/lib/renewal';

import { renewSession } from './session-renewal';

// Privy's own pages load the SDK, which renews Privy's session by itself.
const onPrivyPage = () =>
  /^\/earn\/(signin|signup|wallet)(\/|$)/.test(window.location.pathname);

// When Privy should next vouch, on this browser's clock. It's only compared
// with that same clock and set from fixed intervals, so a clock that's wrong
// can't make it run early or in a loop.
interface Plan {
  readonly due: number;
  readonly failures: number;
}

// While a signed-in page is open, has Privy vouch for the session again once
// it's a day old, in a hidden frame. Nothing on the page changes for it:
// Earn's own cookie already keeps them signed in. Each time moves that
// cookie's 30 days on and keeps Privy's own session from running out. Only
// if Privy has ended the session does the page show them signed out. It
// waits for the page to settle and for the tab to be in view, and a
// renewal by another tab that day counts for this one.
export function SessionKeeper({ confirmIn }: { confirmIn: number | null }) {
  const router = useRouter();
  const [plan, setPlan] = useState<Plan | null>(() =>
    confirmIn === null
      ? null
      : { due: Date.now() + Math.max(confirmIn, SETTLE_MS), failures: 0 },
  );

  useEffect(() => {
    if (plan === null || onPrivyPage()) return undefined;
    let live = true;
    const confirm = () => {
      // A tab out of view waits; `wake` runs it once the tab is back.
      if (document.visibilityState !== 'visible') return;
      void renewSession(CONFIRM_MS).then((renewal) => {
        if (!live) return;
        if (renewal.kind === 'signed-out') {
          setPlan(null);
          router.refresh();
        } else if (renewal.kind === 'failed') {
          // Their session stands meanwhile; ask again later.
          const failures = plan.failures + 1;
          setPlan({ due: Date.now() + retryDelay(failures), failures });
        } else {
          setPlan({ due: Date.now() + CONFIRM_MS, failures: 0 });
        }
      });
    };
    const timer = setTimeout(confirm, Math.max(plan.due - Date.now(), 0));
    // Timers stop while a laptop sleeps; check again when the page is back.
    const wake = () => {
      if (document.visibilityState === 'visible' && Date.now() >= plan.due) {
        confirm();
      }
    };
    document.addEventListener('visibilitychange', wake);
    return () => {
      live = false;
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', wake);
    };
  }, [plan, router]);

  return null;
}
