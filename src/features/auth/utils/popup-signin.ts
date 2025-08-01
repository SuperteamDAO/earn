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

// Get NextAuth base URL
function getNextAuthBaseUrl(): string {
  return `${window.location.origin}/api/auth`;
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

  const defaultCallbackUrl = openInNewWindow
    ? `${window.location.origin}/auth/popup-callback`
    : window.location.href;

  const { callbackUrl = defaultCallbackUrl, redirect = true } = options ?? {}; // openInNewWindow already extracted above

  const baseUrl = getNextAuthBaseUrl();
  const providers = await getProviders();

  if (!providers) {
    window.location.href = `${baseUrl}/error`;
    return;
  }

  if (!provider || !(provider in providers)) {
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
    return new Promise((resolve) => {
      openSignInWindow(
        data.url,
        'twitter-auth',
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

export const openSignInWindow = (
  url: string,
  name: string,
  baseURL: string,
  onComplete?: (success: boolean, error?: string) => void,
): void => {
  const strWindowFeatures =
    'toolbar=no, menubar=no, width=600, height=700, top=100, left=100';

  console.log('openSignInWindow', url, name, baseURL);

  if (windowObjectReference === null || windowObjectReference.closed) {
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
    // Verify origin for security
    if (event.origin !== window.location.origin) {
      return;
    }

    try {
      const params = new URLSearchParams(event.data);
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

  // Add the listener for receiving a message from the popup
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
