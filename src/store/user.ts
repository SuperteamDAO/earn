import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { signOut, useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { type User } from '@/interface/user';

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
  const { status } = useSession();

  const { data, error, refetch, isLoading } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data } = await axios.get<User>('/api/user/');
      return data;
    },
    enabled: status === 'authenticated',
  });

  useEffect(() => {
    if (data) {
      setUser(data);
    }
  }, [data, setUser]);

  const refetchUser = async () => {
    await refetch();
  };

  return { user, isLoading, error, refetchUser };
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  const setUser = useUserStore((state) => state.setUser);

  return useMutation({
    mutationFn: (userData: Partial<User>) =>
      axios.post<User>('/api/user/update/', userData),
    onSuccess: (data) => {
      queryClient.setQueryData(['user'], data.data);
      setUser(data.data);
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  const setUser = useUserStore((state) => state.setUser);

  return () => {
    queryClient.setQueryData(['user'], null);
    setUser(null);
    localStorage.removeItem('user-storage');
    signOut();
  };
};
