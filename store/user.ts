import { create } from 'zustand';
import { User } from '../interface/user';
import produce from 'immer';
import { mountStoreDevtool } from 'simple-zustand-devtools';
import { SponsorType } from '../interface/sponsor';
interface UserState {
  userInfo: User | null;
  setUserInfo: (user: User) => void;
}

export const userStore = create<UserState>((set) => ({
  userInfo: null,
  setUserInfo: (user: User): void =>
    set(
      produce((state: UserState) => {
        state.userInfo = user;
      })
    ),
}));
if (process.env.NODE_ENV === 'development') {
  mountStoreDevtool('profileStore', userStore);
}
