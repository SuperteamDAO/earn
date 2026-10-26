'use client';

import { useEffect, useRef, useState } from 'react';

import {
  SIGN_IN_GOOGLE,
  SIGN_IN_HEIGHT,
  SIGNED_IN,
} from '@/lib/auth/sign-in-messages';
import { safeNext } from '@/lib/safe-next';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

// Earn's <SignIn> form where Earn rendered it: the sign-in page framed
// (Privy loads only there), sized to what it reports. Signed in, the page
// loads again at `next`; Google can't sign in inside a frame, so it goes to
// the sign-in page for that.
export function EmbeddedSignIn({ next }: { next: string }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(420);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (
        event.origin !== window.location.origin ||
        event.source !== frame.current?.contentWindow ||
        !isRecord(event.data)
      ) {
        return;
      }
      const data = event.data;
      if (data.type === SIGN_IN_HEIGHT && typeof data.height === 'number') {
        setHeight(Math.min(Math.max(data.height, 200), 800));
      } else if (data.type === SIGNED_IN && typeof data.href === 'string') {
        // A full load, so the page knows who they are.
        window.location.assign(safeNext(data.href));
      } else if (data.type === SIGN_IN_GOOGLE) {
        window.location.assign(
          `/earn/signin/?google=1&next=${encodeURIComponent(next)}`,
        );
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [next]);

  return (
    // Earn's own sign-in page, same origin: Privy needs its scripts and
    // cookies there, which no sandbox would leave.
    // oxlint-disable-next-line react/iframe-missing-sandbox
    <iframe
      ref={frame}
      title="Sign in"
      src={`/earn/signin/?embed=1&heading=0&next=${encodeURIComponent(next)}`}
      // Earn's <SignIn> took its content's width (30.25rem) in the
      // centered column; a frame can't size itself to that.
      className="block w-full max-w-[30.25rem] border-0"
      style={{ height }}
    />
  );
}
