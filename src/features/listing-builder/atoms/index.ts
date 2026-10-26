import { atom, createStore } from 'jotai';

import type { BountyType } from '@/generated/prisma/enums';
import type { Skills } from '@/interface/skills';
import type { GeneratedRewards } from '@/server/listing-ai';

import type { ListingStatus } from '../types';
import type { TEligibilityQuestion } from '../types/schema';

export interface GeneratedListingData {
  description?: string;
  token?: string | null;
  title?: string;
  rewards?: GeneratedRewards;
  skills?: Skills;
  eligibilityQuestions?: TEligibilityQuestion[];
  type?: BountyType;
}

const store: ReturnType<typeof createStore> = createStore();

const isGodAtom = atom<boolean>(false);
const isSTAtom = atom<boolean>(false);
const isEditingAtom = atom<boolean>(false);
const listingStatusAtom = atom<ListingStatus | undefined>(undefined);
const isDraftSavingAtom = atom(false);
const hideAutoSaveAtom = atom<boolean>(true);
const descriptionKeyAtom = atom<string | number>(1);
const skillsKeyAtom = atom<string | number>(1);
const isAutoGenerateOpenAtom = atom<boolean>(false);
const generatedListingAtom = atom<GeneratedListingData | undefined>(undefined);

interface SaveQueueState {
  isProcessing: boolean;
  shouldProcessNext: boolean;
}
const draftQueueAtom = atom<SaveQueueState>({
  isProcessing: false,
  shouldProcessNext: false,
});

const confirmModalAtom = atom<
  'SUCCESS' | 'VERIFICATION_SHOW_FORM' | 'VERIFICATION_SHOW_MODAL' | undefined
>(undefined);
const previewAtom = atom(false);

// Publishing or updating (the PrePublish modal's button).
const submitStatusAtom = atom<'idle' | 'pending' | 'success' | 'error'>('idle');
// Slug checks in flight (Slug field, header and modal wait for them).
const slugCheckingAtom = atom(0);

export {
  confirmModalAtom,
  descriptionKeyAtom,
  draftQueueAtom,
  generatedListingAtom,
  hideAutoSaveAtom,
  isAutoGenerateOpenAtom,
  isDraftSavingAtom,
  isEditingAtom,
  isGodAtom,
  isSTAtom,
  listingStatusAtom,
  previewAtom,
  slugCheckingAtom,
  skillsKeyAtom,
  store,
  submitStatusAtom,
};
