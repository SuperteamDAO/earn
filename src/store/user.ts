import produce from 'immer';
import { mountStoreDevtool } from 'simple-zustand-devtools';
import { create } from 'zustand';

import type { User } from '@/interface/user';

interface UserState {
  userInfo: User | null;
  setUserInfo: (user: User) => void;
}

export const userStore = create<UserState>((set) => ({
  userInfo: null,
  setUserInfo: (user: User): void =>
    set(
      produce((state: UserState) => {
        // eslint-disable-next-line no-param-reassign
        state.userInfo = user;
      })
    ),
}));
if (process.env.NODE_ENV === 'development') {
  mountStoreDevtool('profileStore', userStore);
}
