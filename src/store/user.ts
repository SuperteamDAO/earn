import { usePrivy } from '@privy-io/react-auth';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { type User } from '@/interface/user';
import { api } from '@/lib/api';

interface UserState {
  user: User | null;
  setUser: (user: User | null) => void;
}

const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export const useUser = () => {
  const { user, setUser } = useUserStore();
  const { authenticated, ready, logout } = usePrivy();
  const router = useRouter();

  const { data, error, refetch, isLoading, isError } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data } = await api.get<User>('/api/user/');
      if (data?.isBlocked && !router.pathname.includes('/blocked')) {
        router.push('/blocked');
      }
      return data;
    },
    enabled: authenticated && ready,
  });

  useEffect(() => {
    if (data) {
      setUser(data);
    }
  }, [data, setUser]);

  useEffect(() => {
    async function authCheck() {
      if (ready && authenticated) {
        if (isError) {
          if (axios.isAxiosError(error)) {
            if (error.status === 401) {
              localStorage.removeItem('user-storage');
              await logout();
              window.location.reload();
            }
          }
        }
      }
    }
    authCheck();
  }, [error, isError, ready, authenticated]);

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
    onSuccess: (data) => {
      queryClient.setQueryData(['user'], data.data);
      setUser(data.data);
    },
  });
};

export const useLogout = () => {
  const { logout } = usePrivy();
  const queryClient = useQueryClient();

  return async () => {
    queryClient.setQueryData(['user'], null);
    localStorage.removeItem('user-storage');
    await logout();
    window.location.reload();
  };
};
