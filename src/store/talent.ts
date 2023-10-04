import produce from 'immer';
import { mountStoreDevtool } from 'simple-zustand-devtools';
import { create } from 'zustand';

import type { Talent } from '../interface/talent';

interface TalentState {
  talentInfo: Talent | null;
  setTalentInfo: (user: Talent) => void;
}

export const TalentStore = create<TalentState>((set) => ({
  talentInfo: null,
  setTalentInfo: (talent: Talent): void =>
    set(
      produce((state: TalentState) => {
        // eslint-disable-next-line no-param-reassign
        state.talentInfo = talent;
      })
    ),
}));
if (process.env.NODE_ENV === 'development') {
  mountStoreDevtool('profileStore', TalentStore);
}
