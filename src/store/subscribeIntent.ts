import { create } from 'zustand';

interface SubscribeIntentStore {
  pendingListingId: string | null;
  setIntent: (id: string | null) => void;
}

export const useSubscribeIntent = create<SubscribeIntentStore>((set) => ({
  pendingListingId: null,
  setIntent: (id) => set({ pendingListingId: id }),
}));
