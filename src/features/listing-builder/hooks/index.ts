import { useForm, useFormContext, UseFormReturn } from "react-hook-form";
import { createListingRefinements, ListingFormData } from "../types";
import { useAtomValue } from "jotai";
import { formSchemaAtom, isDuplicatingAtom, isEditingAtom, isGodAtom, isSTAtom, listingIdAtom, saveDraftMutationAtom, submitListingMutationAtom } from "../atoms";
import { useCallback, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

interface UseListingFormReturn extends UseFormReturn<ListingFormData> {
  saveDraft: () => Promise<void>;
  submitListing: () => Promise<void>;
  resetForm: () => void;
  validateRewards: () => Promise<boolean>
  validateBasics: () => Promise<boolean>
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

  const isGod = useAtomValue(isGodAtom);
  const isEditing = useAtomValue(isEditingAtom);
  const isDuplicating = useAtomValue(isDuplicatingAtom);
  const isST = useAtomValue(isSTAtom);
  const listingId = useAtomValue(listingIdAtom);

  type ValidationFields = Partial<Record<keyof ListingFormData, true>>;

  const validateFields = useCallback(async (fields: ValidationFields) => {
    const values = formMethods.getValues();

    // Transform array rewards if present
    if ('rewards' in fields && Array.isArray(values.rewards)) {
      const rewardsObject = values.rewards.reduce((acc, value, index) => {
        acc[index + 1] = value;
        return acc;
      }, {});
      formMethods.setValue('rewards', rewardsObject);
      values.rewards = rewardsObject;
    }

    const innerSchema = formSchema._def.schema;
    const partialSchema = innerSchema.pick(fields).superRefine((data, ctx) => {
      createListingRefinements(data as any, ctx, isGod, isEditing, isDuplicating, isST, listingId);
    });

    try {
      await partialSchema.parseAsync(values);
      // Only clear errors for the fields we validated
      formMethods.clearErrors(Object.keys(fields) as Array<keyof ListingFormData>);
      return true;
    } catch (error) {
      console.log('validation error', error);
      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => {
          const fieldName = err.path.join('.') as keyof ListingFormData;
          formMethods.setError(fieldName, {
            type: err.code,
            message: err.message
          });
        });
      }
      return false;
    }
  }, [formMethods, formSchema, isGod, isEditing, isDuplicating, isST, listingId]);

  // Usage:
  const validateRewards = () => validateFields({
    type: true,
    compensationType: true,
    token: true,
    rewardAmount: true,
    rewards: true,
    minRewardAsk: true,
    maxRewardAsk: true,
    maxBonusSpots: true,
  });

  const validateBasics = () => validateFields({
    title: true,
    type: true,
    description: true,
    rewards: true,
    deadline: true,
    skills: true,
    pocSocials: true,
    eligibility: true,
  });

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
    validateRewards,
    validateBasics
  };
};
