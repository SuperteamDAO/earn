import type { RedirectableProviderType } from 'next-auth/providers';
import type { SignInResponse } from 'next-auth/react';

export interface SignInOptions extends Record<string, unknown> {
  /**
   * Specify to which URL the user will be redirected after signing in. Defaults to the page URL the sign-in is initiated from.
   *
   * [Documentation](https://next-auth.js.org/getting-started/client#specifying-a-callbackurl)
   */
  callbackUrl?: string;
  /** [Documentation](https://next-auth.js.org/getting-started/client#using-the-redirect-false-option) */
  redirect?: boolean;
  /** Open the signin page in a new tab or window. Defaults to `false` */
  openInNewWindow?: boolean;
}

export interface SignInAuthorisationParams extends Record<string, string> {}

export interface PopupAuthResponse {
  error?: string | null;
  status: number;
  ok: boolean;
  url?: string | null;
}

export type SignInResult<
  P extends RedirectableProviderType | undefined = undefined,
> = P extends RedirectableProviderType ? SignInResponse | undefined : undefined;
