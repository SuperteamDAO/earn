import { create } from 'zustand';
import { User } from '../interface/user';

interface UserState {
  userInfo: User | null;
}
const userStore = create<UserState>((set) => ({
  userInfo: null,
}));
