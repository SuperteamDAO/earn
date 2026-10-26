'use client';

import { useEffect } from 'react';

// Hands this page's query (`?x=verified&handle=…`, `?x=failed`) to the tab
// that opened the popup, then closes it.
export function NotifyOpener() {
  useEffect(() => {
    try {
      if (window.opener) {
        try {
          window.opener.postMessage(
            { type: 'earn-auth', query: window.location.search },
            window.location.origin,
          );
        } catch {
          // Ignore postMessage errors.
        }
      }
    } finally {
      window.close();
    }
  }, []);
  return null;
}
