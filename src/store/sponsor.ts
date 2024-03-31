import { produce } from 'immer';
import { mountStoreDevtool } from 'simple-zustand-devtools';
import { create } from 'zustand';

import type { SponsorType } from '@/interface/sponsor';

interface SponsorState {
  currentSponsor: SponsorType | null;
  setCurrentSponsor: (sponsor: SponsorType) => void;
}

export const SponsorStore = create<SponsorState>((set) => ({
  currentSponsor: null,
  setCurrentSponsor: (sponsor: SponsorType) =>
    set(
      produce((state: SponsorState) => {
        state.currentSponsor = sponsor;
      }),
    ),
}));
if (process.env.NODE_ENV === 'development') {
  mountStoreDevtool('profileStore', SponsorStore);
}
