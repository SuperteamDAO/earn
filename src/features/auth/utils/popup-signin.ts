import type {
  BuiltInProviderType,
  RedirectableProviderType,
} from 'next-auth/providers';
import { getCsrfToken, getProviders, type LiteralUnion } from 'next-auth/react';

import type {
  SignInAuthorisationParams,
  SignInOptions,
  SignInResult,
} from '../types/auth-popup';

const BASE_PATH = '/earn';

function getNextAuthBaseUrl(): string {
  return `${window.location.origin}${BASE_PATH}/api/auth`;
}

/**
 * Client-side method to initiate a signin flow in a popup window
 * or send the user to the signin page listing all possible providers.
 * Automatically adds the CSRF token to the request.
 *
 * Enhanced version of NextAuth signIn with popup window support.
 */
export async function signInWithPopup<
  P extends RedirectableProviderType | undefined = undefined,
>(
  provider?: LiteralUnion<BuiltInProviderType>,
  options?: SignInOptions,
  authorizationParams?: SignInAuthorisationParams,
): Promise<SignInResult<P>> {
  // Derive default callback URL. For popup-based flows we want the child
  // window to load a lightweight page that notifies the opener via
  // postMessage and then closes itself. This prevents the popup from loading
  // the entire application and ensures the original tab can update its
  // session state.
  const openInNewWindow = options?.openInNewWindow ?? false;

  // IMPORTANT (iOS Safari/Brave): open a placeholder popup synchronously
  // within the original user gesture (click) before any awaits. Later, once
  // the OAuth URL is known, we navigate this already-open window. This avoids
  // popup blocking on iOS which requires synchronous opening.
  const popupWindowName = 'twitter-auth';
  const popupWindowFeatures =
    'toolbar=no, menubar=no, width=600, height=700, top=100, left=100';
  let preOpenedWindow: Window | null = null;
  if (openInNewWindow) {
    try {
      preOpenedWindow = window.open('', popupWindowName, popupWindowFeatures);
      // Optional lightweight inline content for better UX while we fetch
      // the provider URL.
      try {
        preOpenedWindow?.document.write(
          `<!doctype html><html><head><title>Sign in</title><meta name="viewport" content="width=device-width, initial-scale=1" /></head><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
            <div style="padding:16px; color:#0f172a;">Opening Twitter…</div>
          </body></html>`,
        );
      } catch {
        // ignore document write errors (cross-origin/navigation races)
      }
    } catch {
      // If the popup is blocked even on the initial synchronous call, we'll
      // fall back to a regular redirect later when we have the URL.
      preOpenedWindow = null;
    }
  }

  const defaultCallbackUrl = openInNewWindow
    ? `${window.location.origin}${BASE_PATH}/auth/popup-callback`
    : window.location.href;

  const { callbackUrl = defaultCallbackUrl, redirect = true } = options ?? {}; // openInNewWindow already extracted above

  const baseUrl = getNextAuthBaseUrl();
  const providers = await getProviders();

  if (!providers) {
    // Close the pre-opened window if we cannot continue
    if (preOpenedWindow && !preOpenedWindow.closed) preOpenedWindow.close();
    window.location.href = `${baseUrl}/error`;
    return;
  }

  if (!provider || !(provider in providers)) {
    if (preOpenedWindow && !preOpenedWindow.closed) preOpenedWindow.close();
    window.location.href = `${baseUrl}/signin?${new URLSearchParams({
      callbackUrl,
    })}`;
    return undefined as SignInResult<P>;
  }

  const providerConfig = providers[provider];
  const isCredentials = providerConfig?.type === 'credentials';
  const isEmail = providerConfig?.type === 'email';
  const isSupportingReturn = isCredentials || isEmail;

  const signInUrl = `${baseUrl}/${
    isCredentials ? 'callback' : 'signin'
  }/${provider}`;

  const _signInUrl = `${signInUrl}?${new URLSearchParams(authorizationParams || {})}`;

  const res = await fetch(_signInUrl, {
    method: 'post',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      csrfToken: (await getCsrfToken()) || '',
      callbackUrl,
      json: 'true',
    }),
  });

  const data = await res.json();

  if (openInNewWindow) {
    // If we failed to pre-open a window (likely blocked), fall back to a
    // full-page redirect to ensure the auth flow still works on strict
    // mobile browsers.
    if (!preOpenedWindow) {
      const url = data.url ?? callbackUrl;
      window.location.href = url;
      if (url.includes('#')) window.location.reload();
      return;
    }

    return new Promise((resolve) => {
      // Navigate the already opened window to the provider URL and attach
      // the message listener to resolve the promise on completion.
      // If the initial open was blocked and no window exists, let the helper
      // try opening (or fall back to redirect by browser behavior).
      openSignInWindow(
        data.url,
        popupWindowName,
        baseUrl,
        (success: boolean, error?: string) => {
          if (success) {
            resolve(undefined as SignInResult<P>);
          } else {
            resolve({
              error: error || 'Authentication failed',
              status: 400,
              ok: false,
              url: null,
            } as SignInResult<P>);
          }
        },
        preOpenedWindow,
      );
    });
  }

  if (redirect || !isSupportingReturn) {
    const url = data.url ?? callbackUrl;
    window.location.href = url;
    if (url.includes('#')) window.location.reload();
    return;
  }

  const error = new URL(data.url).searchParams.get('error');

  return {
    error,
    status: res.status,
    ok: res.ok,
    url: error ? null : data.url,
  } as SignInResult<P>;
}

let windowObjectReference: Window | null = null;
let previousUrl: string | null = null;

const openSignInWindow = (
  url: string,
  name: string,
  baseURL: string,
  onComplete?: (success: boolean, error?: string) => void,
  existingWindow?: Window | null,
): void => {
  const strWindowFeatures =
    'toolbar=no, menubar=no, width=600, height=700, top=100, left=100';

  if (process.env.NODE_ENV === 'development') {
    console.log('openSignInWindow', url, name, baseURL);
  }

  // Prefer an existing pre-opened window (opened synchronously in a user-gesture)
  if (existingWindow && !existingWindow.closed) {
    windowObjectReference = existingWindow;
    try {
      windowObjectReference.location.href = url;
    } catch {
      // Fallback if direct location set fails
      try {
        windowObjectReference.assign(url);
      } catch {
        // As a last resort, try reopening/navigating
        windowObjectReference = window.open(url, name, strWindowFeatures);
      }
    }
  } else if (windowObjectReference === null || windowObjectReference.closed) {
    /* if the pointer to the window object in memory does not exist
     or if such pointer exists but the window was closed */
    windowObjectReference = window.open(url, name, strWindowFeatures);
  } else if (previousUrl !== url) {
    /* if the resource to load is different,
     then we load it in the already opened secondary window and then
     we bring such window back on top/in front of its parent window. */
    windowObjectReference = window.open(url, name, strWindowFeatures);
    windowObjectReference?.focus();
  } else {
    /* else the window reference must exist and the window
     is not closed; therefore, we can bring it back on top of any other
     window with the focus() method. There would be no need to re-create
     the window or to reload the referenced resource. */
    windowObjectReference.focus();
  }

  // Message handler for popup communication
  const receiveMessage = (event: MessageEvent) => {
    // Some browsers on Windows may report different origins for OAuth redirects
    // or transiently nullify opener relationships. We validate the payload shape
    // and allow either same-origin or messages coming from the popup window.
    const isSameOrigin =
      event.origin === window.location.origin || event.origin === 'null';
    const isFromPopup = event.source === windowObjectReference;
    if (!isSameOrigin && !isFromPopup) {
      return;
    }

    try {
      const data =
        typeof event.data === 'string'
          ? { type: 'earn-auth', query: event.data }
          : (event.data as any);
      if (data?.type !== 'earn-auth') return;
      const params = new URLSearchParams(String(data.query || ''));
      const error = params.get('error');

      if (error) {
        onComplete?.(false, error);
      } else {
        onComplete?.(true);
      }
    } catch (err) {
      console.error('Error parsing popup message:', err);
      onComplete?.(false, 'Failed to parse authentication response');
    }

    // Clean up
    window.removeEventListener('message', receiveMessage);
    if (windowObjectReference && !windowObjectReference.closed) {
      windowObjectReference.close();
    }
    windowObjectReference = null;
  };

  // Add the listener for receiving completion from the popup
  window.addEventListener('message', receiveMessage, false);

  // assign the previous URL
  previousUrl = url;

  // Handle popup being closed manually
  const checkClosed = setInterval(() => {
    if (windowObjectReference?.closed) {
      clearInterval(checkClosed);
      window.removeEventListener('message', receiveMessage);
      onComplete?.(false, 'Popup was closed');
      windowObjectReference = null;
    }
  }, 1000);
};
