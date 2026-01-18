import Link from 'next/link';
import { useEffect } from 'react';

/**
 * Lightweight page used exclusively as the callback target for popup-based
 * authentication flows (e.g., Twitter OAuth).
 *
 * It immediately forwards the query string to the `window.opener` via
 * `postMessage`, allowing the original window to resolve the authentication
 * promise, refresh its session, and continue the user flow.
 *
 * After sending the message, the page attempts to close itself. If it cannot
 * (e.g., the user opened it directly), it renders a simple fallback UI with a
 * link back to the home page.
 */
export default function PopupCallback() {
  useEffect(() => {
    try {
      // Send the search params (e.g., "?error=OAuthAccountNotLinked") back to
      // the opener. The listener on the parent page expects a raw query string.
      if (window.opener) {
        try {
          window.opener.postMessage(
            { type: 'earn-auth', query: window.location.search },
            window.location.origin,
          );
        } catch {
          // Ignore postMessage errors and rely on storage fallback
        }
      }
      // Intentionally no storage fallback to minimize surface area.
    } finally {
      // Close the window if possible. Some browsers may block this if the page
      // wasn't opened via `window.open`.
      window.close();
    }
  }, []);

  // Fallback UI in case the window could not be closed automatically.
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <p className="text-center text-sm text-slate-600">
        You can now close this window and return to the original tab.
      </p>
      <Link href="/earn" className="text-primary underline">
        Go to home
      </Link>
    </div>
  );
}
