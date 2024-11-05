import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { 
  formAtom,
  formSchemaAtom,
  formActionsAtom,
  draftStorageAtom,
  fetchListingAtom,
  listingIdAtom,
  editableAtom,
  isDuplicatingAtom
} from '../atoms';

export const useListingForm = () => {
  const [form] = useAtom(formAtom);
  const formSchema = useAtomValue(formSchemaAtom);
  const dispatchForm = useSetAtom(formActionsAtom);
  const draft = useAtomValue(draftStorageAtom);
  const listing = useAtomValue(fetchListingAtom);
  const isEditing = useAtomValue(editableAtom);
  const isDuplicating = useAtomValue(isDuplicatingAtom);
  const listingId = useAtomValue(listingIdAtom);

  const methods = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: draft
  });

  useEffect(() => {
    if (!form) {
      dispatchForm({ type: 'SET_FORM', payload: methods });
    }
  }, [form, methods, dispatchForm]);

  useEffect(() => {
    if (listing.data && isEditing && !isDuplicating) {
      methods.reset(listing.data);
    }
  }, [listing, isEditing, isDuplicating, methods]);
  ;

  // Auto-save draft every 30 seconds if form is dirty
  useEffect(() => {
    if (!form?.formState.isDirty) return;

    const timer = setInterval(() => {
      dispatchForm({ type: 'SAVE_DRAFT' });
    }, 30000);

    return () => clearInterval(timer);
  }, [form?.formState.isDirty, dispatchForm]);

  return {
    form: methods,
    saveDraft: () => dispatchForm({ type: 'SAVE_DRAFT' }),
    submitListing: () => dispatchForm({ type: 'SUBMIT' }),
    resetForm: () => dispatchForm({ type: 'RESET' }),
    loadDraft: () => dispatchForm({ type: 'LOAD_DRAFT' }),
    isEditing,
    isDuplicating,
    listingId
  };
};
