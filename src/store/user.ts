import produce from 'immer';
import { signOut } from 'next-auth/react';
import { mountStoreDevtool } from 'simple-zustand-devtools';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { User } from '@/interface/user';

interface UserState {
  userInfo: User | null;
  setUserInfo: (user: User) => void;
  setIsLoggedIn: (isLoggedIn: boolean) => void;
  isLoggedIn: boolean;
  logOut: () => void;
}

export const userStore = create(
  persist<UserState>(
    (set) => ({
      userInfo: null,
      isLoggedIn: false,
      setIsLoggedIn: (isLoggedIn: boolean): void =>
        set(
          produce((state: UserState) => {
            // eslint-disable-next-line no-param-reassign
            state.isLoggedIn = isLoggedIn;
          })
        ),
      setUserInfo: (user: User): void =>
        set(
          produce((state: UserState) => {
            // eslint-disable-next-line no-param-reassign
            state.userInfo = user;
          })
        ),
      logOut: () => {
        set({ userInfo: null });
        localStorage.removeItem('user-storage');
        signOut();
      },
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

if (process.env.NODE_ENV === 'development') {
  mountStoreDevtool('profileStore', userStore);
}
