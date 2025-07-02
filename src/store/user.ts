'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useRouter } from 'next/router';
import posthog from 'posthog-js';
import { useEffect } from 'react';

import { useForcedProfileRedirect } from '@/hooks/use-forced-profile-redirect';
import { type User } from '@/interface/user';
import { api } from '@/lib/api';

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

        if (fetchedUser?.isBlocked && !router.pathname.includes('/blocked')) {
          router.push('/blocked');
        }
        return fetchedUser;
      } catch (error) {
        if (ready && authenticated) {
          if (axios.isAxiosError(error)) {
            if (error.response?.status === 401) {
              console.warn('User request returned 401, logging out.');
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

  useEffect(() => {
    if (isLoading || !ready) return;

    if (!user) {
      if (posthog._isIdentified()) posthog.reset();
      return;
    }

    const profileComplete = user.isTalentFilled || !!user.currentSponsorId;

    if (profileComplete) {
      const alreadyIdentified = posthog._isIdentified();
      const sameUser = posthog.get_distinct_id() === String(user.id);

      if (!alreadyIdentified || !sameUser) {
        posthog.identify(user.id, { email: user.email });
      }
    }
  }, [user, isLoading, ready]);

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
      }
    },
  });
};

export const useLogout = () => {
  const { logout } = usePrivy();
  const queryClient = useQueryClient();

  return async () => {
    await logout();

    queryClient.clear();
    if (posthog._isIdentified()) posthog.reset();

    window.location.reload();
  };
};
