import { useLoginWithOAuth } from '@privy-io/react-auth';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { api } from '@/lib/api';

import { OAUTH_QUERY_PARAMS, OAUTH_STORAGE_KEY } from '../constants/oauth';

interface UseOAuthProps {
  onSuccess?: () => void;
  redirectTo?: string;
}

export const useOAuth = ({ onSuccess, redirectTo }: UseOAuthProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const inOAuthFlow = localStorage.getItem(OAUTH_STORAGE_KEY) === 'true';
    setIsLoading(inOAuthFlow);
  }, []);

  const { initOAuth } = useLoginWithOAuth({
    onComplete: async ({ isNewUser, user }) => {
      if (isNewUser) {
        await api.post('/api/user/create', { email: user.email });
      }

      localStorage.removeItem(OAUTH_STORAGE_KEY);

      const query = { ...router.query };
      OAUTH_QUERY_PARAMS.forEach((param) => delete query[param]);

      await router.replace(
        {
          pathname: router.pathname,
          query: {
            ...query,
            loginState: 'signedIn',
            ...(redirectTo && { originUrl: router.asPath }),
          },
        },
        undefined,
        { shallow: true },
      );

      onSuccess?.();
      if (redirectTo) {
        router.push(redirectTo);
      }
    },
  });

  const startOAuth = async () => {
    setIsLoading(true);
    localStorage.setItem(OAUTH_STORAGE_KEY, 'true');
    await initOAuth({ provider: 'google' });
  };

  return {
    isLoading,
    startOAuth,
  };
};
