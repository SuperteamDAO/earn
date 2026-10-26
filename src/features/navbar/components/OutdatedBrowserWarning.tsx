'use client';

import { X } from 'lucide-react';
import { useState, useSyncExternalStore } from 'react';

import { isBrowserOutdated } from '@/utils/browser-detection';

const DISMISSED = 'browser-warning-dismissed';

const subscribe = () => () => {};

export const OutdatedBrowserWarning = () => {
  // Only the browser knows: nothing on the server's render.
  const isOutdated = useSyncExternalStore(
    subscribe,
    () => localStorage.getItem(DISMISSED) !== 'true' && isBrowserOutdated(),
    () => false,
  );
  const [isDismissed, setIsDismissed] = useState(false);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem(DISMISSED, 'true');
  };

  if (!isOutdated || isDismissed) {
    return null;
  }

  return (
    <div className="relative block w-full bg-orange-600 text-white">
      <div className="flex items-center justify-between px-1 py-3 md:px-3">
        <p className="flex-1 text-center text-[11px] md:text-sm">
          Your browser is outdated. Some features might not work properly.
          Please update your browser for the best experience.
        </p>
        <button
          onClick={handleDismiss}
          className="ml-0.5 flex-shrink-0 rounded-full p-1 hover:bg-orange-700 md:ml-2"
          aria-label="Dismiss browser warning"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
