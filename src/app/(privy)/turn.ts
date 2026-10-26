'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { takeTurn } from '@/lib/auth/session-renewal';

// A Privy page starts Privy's SDK only on its turn: never while a hidden
// renewal or sign-out in another tab is trading the same refresh token,
// which works once (see session-renewal.ts). `ready` passes the turn on once
// Privy has started.
export function useTurn() {
  const [started, setStarted] = useState(false);
  const done = useRef(() => {});
  useEffect(() => {
    const { turn, cancel } = takeTurn();
    let live = true;
    void turn.then((finish) => {
      if (!live) return;
      done.current = finish;
      setStarted(true);
    });
    return () => {
      live = false;
      cancel();
    };
  }, []);
  const ready = useCallback(() => done.current(), []);
  return { started, ready };
}
