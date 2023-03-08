import { create } from 'zustand';
import { User } from '../interface/user';
import produce from 'immer';
import { mountStoreDevtool } from 'simple-zustand-devtools';
import { SponsorType } from '../interface/sponsor';
import { Talent } from '../interface/talent';
interface TalentState {
  talentInfo: Talent | null;
  setTalentInfo: (user: Talent) => void;
}

export const TalentStore = create<TalentState>((set) => ({
  talentInfo: null,
  setTalentInfo: (talent: Talent): void =>
    set(
      produce((state: TalentState) => {
        state.talentInfo = talent;
      })
    ),
}));
if (process.env.NODE_ENV === 'development') {
  mountStoreDevtool('profileStore', TalentStore);
}
