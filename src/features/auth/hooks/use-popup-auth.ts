import type { BuiltInProviderType } from 'next-auth/providers';
import { type LiteralUnion, useSession } from 'next-auth/react';
import { useCallback, useState } from 'react';

import type {
  PopupAuthResponse,
  SignInAuthorisationParams,
  SignInOptions,
} from '../types/auth-popup';
import { signInWithPopup } from '../utils/popup-signin';

interface UsePopupAuthState {
  isLoading: boolean;
  error: string | null;
}

interface UsePopupAuthReturn extends UsePopupAuthState {
  signIn: (
    provider: LiteralUnion<BuiltInProviderType>,
    options?: SignInOptions,
    authorizationParams?: SignInAuthorisationParams,
  ) => Promise<boolean>;
  clearError: () => void;
}

export function usePopupAuth(): UsePopupAuthReturn {
  const [state, setState] = useState<UsePopupAuthState>({
    isLoading: false,
    error: null,
  });

  const { update: updateSession } = useSession();

  const signIn = useCallback(
    async (
      provider: LiteralUnion<BuiltInProviderType>,
      options?: SignInOptions,
      authorizationParams?: SignInAuthorisationParams,
    ): Promise<boolean> => {
      setState({ isLoading: true, error: null });

      try {
        const result = await signInWithPopup(
          provider,
          {
            ...options,
            openInNewWindow: true,
            redirect: false,
          },
          authorizationParams,
        );

        if (result && typeof result === 'object' && 'error' in result) {
          const errorResult = result as PopupAuthResponse;
          if (errorResult.error) {
            setState({ isLoading: false, error: errorResult.error });
            return false;
          }
        }

        // Update session after successful authentication
        await updateSession();
        setState({ isLoading: false, error: null });
        return true;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Authentication failed';
        setState({ isLoading: false, error: errorMessage });
        return false;
      }
    },
    [updateSession],
  );

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    signIn,
    clearError,
  };
}
