import { usePrivy } from '@privy-io/react-auth';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useRouter } from 'next/router';
import posthog from 'posthog-js';
import { useEffect } from 'react';
import { removeCookie, setCookie } from 'typescript-cookie';
import { create } from 'zustand';

import { type User } from '@/interface/user';
import { api } from '@/lib/api';

interface UserState {
  readonly user: User | null;
  readonly setUser: (user: User | null) => void;
}

const useUserStore = create<UserState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));

export const USER_ID_COOKIE_NAME = 'user-id-hint';
const COOKIE_OPTIONS = {
  path: '/',
  secure: process.env.NODE_ENV === 'production',
  expires: 30,
  sameSite: 'lax' as const,
};

export const useUser = () => {
  const { user, setUser } = useUserStore();
  const { authenticated, ready, logout } = usePrivy();
  const router = useRouter();

  const { data, error, refetch, isLoading } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      try {
        const { data: fetchedUser } = await api.get<User>('/api/user/');
        if (fetchedUser) {
          setCookie(USER_ID_COOKIE_NAME, fetchedUser.id, COOKIE_OPTIONS);
        }
        if (fetchedUser?.isBlocked && !router.pathname.includes('/blocked')) {
          router.push('/blocked');
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
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (data) {
      setUser(data);
    }
  }, [data]);

  const refetchUser = async () => {
    await refetch();
  };

  return { user, isLoading: !ready || isLoading, error, refetchUser };
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  const setUser = useUserStore((state) => state.setUser);

  return useMutation({
    mutationFn: (userData: Partial<User>) =>
      api.post<User>('/api/user/update/', userData),
    onSuccess: (response) => {
      const updatedUser = response.data;
      if (updatedUser) {
        queryClient.setQueryData(['user'], updatedUser);
        setUser(updatedUser);
        setCookie(USER_ID_COOKIE_NAME, updatedUser.id, COOKIE_OPTIONS);
      }
    },
  });
};

export const useLogout = () => {
  const { logout } = usePrivy();
  const queryClient = useQueryClient();
  const setUser = useUserStore((state) => state.setUser);

  return async () => {
    await logout();
    queryClient.setQueryData(['user'], null);
    queryClient.removeQueries({ queryKey: ['user'] });
    setUser(null);
    removeCookie(USER_ID_COOKIE_NAME, { path: '/' });
    if (posthog._isIdentified()) posthog.reset();
    window.location.reload();
  };
};
