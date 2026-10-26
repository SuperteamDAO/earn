'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

import { postJson } from '@/lib/fetch-json';

export interface XVerificationResult {
  readonly verified: boolean;
  // The handle X vouched for, lower-cased, as `linkedTwitter` stores it.
  readonly handle: string | null;
  readonly error: string | null;
}

const POPUP_NAME = 'twitter-auth';
const POPUP_FEATURES =
  'toolbar=no, menubar=no, width=600, height=700, top=100, left=100';
const POPUP_LANDING = '/earn/auth/popup-callback/';

const start = (next: string) =>
  postJson<{ url: string }>('/api/x/start/', { next }).then(({ url }) => url);

// Verifies an X account in this tab: off to X, and back to `next` (a path
// on Earn) with `?x=verified&handle=…` or `?x=failed`.
export async function startXVerification(next: string): Promise<void> {
  window.location.assign(await start(next));
}

const resultOf = (query: string): XVerificationResult => {
  const params = new URLSearchParams(query);
  const verified = params.get('x') === 'verified';
  return {
    verified,
    handle: verified ? params.get('handle') : null,
    error: verified ? null : 'Verification failed',
  };
};

// Verifies an X account in a popup, so the form that asked keeps its
// state: resolves once X sends them back (or they close the popup). The
// signed-in account's `linkedTwitter` then has the handle; the page is
// refreshed so `useViewer()` shows it. Call `verify` straight from a click:
// the popup must open within the gesture. If it's blocked, the whole tab
// goes to X and comes back here.
export function useXVerification() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const verify = useCallback(async (): Promise<XVerificationResult> => {
    setIsLoading(true);
    // Opened synchronously, before any await, or browsers block it.
    let popup: Window | null = null;
    try {
      popup = window.open('', POPUP_NAME, POPUP_FEATURES);
      popup?.document.write(
        `<!doctype html><html><head><title>Sign in</title><meta name="viewport" content="width=device-width, initial-scale=1" /></head><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;"><div style="padding:16px; color:#0f172a;">Opening Twitter…</div></body></html>`,
      );
    } catch {
      // Blocked: the tab itself goes below.
    }

    try {
      if (!popup) {
        await startXVerification(
          window.location.pathname + window.location.search,
        );
        return { verified: false, handle: null, error: 'Redirecting' };
      }
      const url = await start(POPUP_LANDING);
      const opened = popup;
      opened.location.href = url;

      const result = await new Promise<XVerificationResult>((resolve) => {
        const finish = (value: XVerificationResult) => {
          window.removeEventListener('message', onMessage);
          clearInterval(closed);
          if (!opened.closed) opened.close();
          resolve(value);
        };
        const onMessage = (event: MessageEvent) => {
          if (
            event.origin !== window.location.origin &&
            event.source !== opened
          ) {
            return;
          }
          const data: unknown = event.data;
          if (
            typeof data !== 'object' ||
            data === null ||
            !('type' in data) ||
            data.type !== 'earn-auth'
          ) {
            return;
          }
          const query =
            'query' in data && typeof data.query === 'string' ? data.query : '';
          finish(resultOf(query));
        };
        const closed = setInterval(() => {
          if (opened.closed) {
            finish({
              verified: false,
              handle: null,
              error: 'Popup was closed',
            });
          }
        }, 1000);
        window.addEventListener('message', onMessage);
      });
      if (result.verified) router.refresh();
      return result;
    } catch {
      if (popup && !popup.closed) popup.close();
      return { verified: false, handle: null, error: 'Verification failed' };
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  return { verify, isLoading };
}
