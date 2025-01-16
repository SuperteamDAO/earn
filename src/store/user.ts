import { usePrivy } from '@privy-io/react-auth';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
  const { authenticated, ready } = usePrivy();
  const router = useRouter();

  const { data, error, refetch, isLoading } = useQuery({
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
    await logout();
    queryClient.setQueryData(['user'], null);
    queryClient.clear();
    localStorage.removeItem('user-storage');
  };
};
