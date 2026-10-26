'use client';

import { useEffect, useEffectEvent } from 'react';

import {
  SIGNED_OUT,
  SIGN_OUT,
  SIGN_OUT_READY,
} from '@/lib/auth/sign-out-messages';

import { useEndSession } from '../../end-session';

// /earn/signin/?sign-out=1, loaded by a public page in a hidden frame (see
// src/lib/auth/sign-out.ts). Loading it does nothing: it signs out only when the
// page that framed it asks, so a GET never ends a session.
export function SignOutFrame() {
  const { ready, endSession } = useEndSession();
  const end = useEffectEvent(() => endSession());

  useEffect(() => {
    // Only ever a frame of Earn's own pages.
    if (window.parent === window) {
      window.location.replace('/earn/');
      return undefined;
    }
    if (!ready) return undefined;
    const origin = window.location.origin;
    let started = false;
    const onMessage = (event: MessageEvent) => {
      const data: unknown = event.data;
      if (
        started ||
        event.origin !== origin ||
        event.source !== window.parent ||
        typeof data !== 'object' ||
        data === null ||
        !('type' in data) ||
        data.type !== SIGN_OUT
      ) {
        return;
      }
      started = true;
      void end().then((ok) => {
        window.parent.postMessage({ type: SIGNED_OUT, ok }, origin);
      });
    };
    window.addEventListener('message', onMessage);
    window.parent.postMessage({ type: SIGN_OUT_READY }, origin);
    return () => window.removeEventListener('message', onMessage);
  }, [ready]);

  return null;
}
