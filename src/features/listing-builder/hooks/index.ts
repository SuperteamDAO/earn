import { useForm, useFormContext, UseFormReturn } from "react-hook-form";
import { ListingFormData } from "../types";
import { useAtomValue } from "jotai";
import { formSchemaAtom, isDuplicatingAtom, isEditingAtom, listingIdAtom, saveDraftMutationAtom, submitListingMutationAtom } from "../atoms";
import { useCallback, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";

interface UseListingFormReturn extends UseFormReturn<ListingFormData> {
  saveDraft: () => Promise<void>;
  submitListing: () => Promise<void>;
  resetForm: () => void;
}

export const useListingForm = (defaultValues?: ListingFormData): UseListingFormReturn => {
  let formMethods: UseFormReturn<ListingFormData> | null = null;
  let isNewFormInitialized = false;

  try {
    formMethods = useFormContext<ListingFormData>();
  } catch (error) {
    // No existing form context
  }

  const formSchema = useAtomValue(formSchemaAtom)
  if (!formMethods || !Object.keys(formMethods).length) {
    formMethods = useForm<ListingFormData>({
      resolver: zodResolver(formSchema),
      defaultValues,
      mode: 'onTouched'
    });
    isNewFormInitialized = true;
  }

  const { getValues, reset } = formMethods;

  const saveDraftMutation = useAtomValue(saveDraftMutationAtom);
  const submitListingMutation = useAtomValue(submitListingMutationAtom);

  const saveDraft = useCallback(async () => {
    const formData = getValues();
    try {
      await saveDraftMutation.mutateAsync(formData);
    } catch (error) {
      console.error('Error saving draft:', error);
    }
  }, [getValues, saveDraftMutation]);

  const submitListing = useCallback(async () => {
    const formData = getValues();
    try {
      await submitListingMutation.mutateAsync(formData);
    } catch (error) {
      console.error('Error submitting listing:', error);
    }
  }, [getValues, submitListingMutation]);

  const resetForm = useCallback(() => {
    reset();
  }, [reset]);

  useEffect(() => {
    if (isNewFormInitialized && process.env.NODE_ENV !== 'production') {
      console.warn(
        'useListingForm: Initialized a new form instance because no form context was found. If this is unintended, ensure your component is wrapped with FormProvider.'
      );
    }
  }, [isNewFormInitialized]);

  return {
    ...formMethods,
    saveDraft,
    submitListing,
    resetForm,
  };
};
