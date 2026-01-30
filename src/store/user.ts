'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useRouter } from 'next/router';
import posthog from 'posthog-js';
import { useEffect } from 'react';
import { getCookie, removeCookie, setCookie } from 'typescript-cookie';

import { useForcedProfileRedirect } from '@/hooks/use-forced-profile-redirect';
import { type User } from '@/interface/user';
import { api } from '@/lib/api';

const USER_ID_COOKIE_NAME = 'user-id-hint';
const COOKIE_OPTIONS = {
  path: '/',
  secure: process.env.NODE_ENV === 'production',
  expires: 30,
  sameSite: 'lax' as const,
} as const;

export const useUser = () => {
  const { authenticated, ready, logout } = usePrivy();
  const router = useRouter();

  const {
    data: user,
    error,
    refetch,
    isLoading,
  } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      try {
        const { data: fetchedUser } = await api.get<User>('/api/user/');

        if (fetchedUser?.id) {
          const currentUserId = getCookie(USER_ID_COOKIE_NAME);
          if (fetchedUser.id !== currentUserId) {
            setCookie(USER_ID_COOKIE_NAME, fetchedUser.id, COOKIE_OPTIONS);
          }
        }

        if (
          fetchedUser?.isBlocked &&
          !router.pathname.includes('/earn/blocked')
        ) {
          router.push('/earn/blocked');
        }
        return fetchedUser;
      } catch (error) {
        if (ready && authenticated) {
          if (axios.isAxiosError(error)) {
            if (error.response?.status === 401) {
              console.warn('User request returned 401, logging out.');
              removeCookie(USER_ID_COOKIE_NAME, { path: '/' });
              await logout();
              if (posthog._isIdentified()) posthog.reset();
            }
          }
        }
        throw error;
      }
    },
    enabled: authenticated && ready,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  useForcedProfileRedirect({
    user: user || null,
    isUserLoading: !ready || isLoading,
  });

  const userId = user?.id;
  const userEmail = user?.email;
  const isTalentFilled = user?.isTalentFilled;
  const currentSponsorId = user?.currentSponsorId;

  useEffect(() => {
    if (isLoading || !ready) return;

    if (!userId) {
      if (posthog._isIdentified()) posthog.reset();
      return;
    }

    const profileComplete = isTalentFilled || !!currentSponsorId;

    if (profileComplete) {
      const alreadyIdentified = posthog._isIdentified();
      const sameUser = posthog.get_distinct_id() === String(userId);

      if (!alreadyIdentified || !sameUser) {
        posthog.identify(userId, { email: userEmail });
      }
    }
  }, [userId, userEmail, isTalentFilled, currentSponsorId, isLoading, ready]);

  return {
    user: user || null,
    isLoading: !ready || isLoading,
    error,
    refetchUser: refetch,
  };
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userData: Partial<User>) =>
      api.post<User>('/api/user/update/', userData),
    onSuccess: (response) => {
      const updatedUser = response.data;
      if (updatedUser) {
        queryClient.setQueryData(['user'], updatedUser);

        const currentUserId = getCookie(USER_ID_COOKIE_NAME);
        if (updatedUser.id !== currentUserId) {
          setCookie(USER_ID_COOKIE_NAME, updatedUser.id, COOKIE_OPTIONS);
        }
      }
    },
  });
};

export const useLogout = () => {
  const { logout } = usePrivy();
  const queryClient = useQueryClient();

  return async () => {
    removeCookie(USER_ID_COOKIE_NAME, { path: '/' });

    await logout();

    queryClient.clear();
    if (posthog._isIdentified()) posthog.reset();

    window.location.reload();
  };
};
