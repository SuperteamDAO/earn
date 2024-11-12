import { useForm, useFormContext, UseFormReturn } from "react-hook-form";
import { createListingRefinements, ListingFormData } from "../types";
import { useAtom, useAtomValue } from "jotai";
import { formSchemaAtom, isDuplicatingAtom, isEditingAtom, isGodAtom, isSTAtom, saveDraftMutationAtom, submitListingMutationAtom } from "../atoms";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import debounce from "lodash.debounce";

interface UseListingFormReturn extends UseFormReturn<ListingFormData> {
  onChange: () => Promise<void>;
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

  const saveDraft = useCallback(async (formData: ListingFormData) => {
    try {
      console.log('main save draft')
      const data = await saveDraftMutation.mutateAsync(formData);
      console.log('draft data - ', data)
      formMethods.setValue('id', data.id)
      // await (
      //   new Promise((resolve) => 
      //     setTimeout(() => resolve("Done!"), 2000)
      //   )
      // )
    } catch (error) {
      console.error('Error saving draft:', error);
    }
  }, [getValues, saveDraftMutation]);

  const isSavingRef = useRef(false);

  const deboncedDraftSave = useMemo(
    () =>
      debounce(async (formData: ListingFormData) => {
        console.log('call debounce draft')
        console.log('isSaving', isSavingRef.current)
        if (isSavingRef.current) return;
        isSavingRef.current = true;
        try {
          await saveDraft(formData);
        } finally {
          isSavingRef.current = false;
        }
      }, 2000),
    [saveDraft]
  );

  
  const onChange = async () => {
    const data = getValues();
    try {
      console.log('call onchange')
      deboncedDraftSave(data);
    } catch (e) {}
  };

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
      createListingRefinements(data as any, ctx, isEditing, isDuplicating);
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
  }, [formMethods, formSchema, isGod, isEditing, isDuplicating, isST]);

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
    compensationType: true,
    token: true,
    rewardAmount: true,
    minRewardAsk: true,
    maxRewardAsk: true,
    maxBonusSpots: true,
  });

  useEffect(() => {
    if (isNewFormInitialized && process.env.NODE_ENV !== 'production') {
      console.warn(
        'useListingForm: Initialized a new form instance because no form context was found. If this is unintended, ensure your component is wrapped with FormProvider.'
      );
    }
  }, [isNewFormInitialized]);

  useEffect(() => {
    console.log('form is dirty', formMethods.formState.isDirty)
  },[formMethods])

  return {
    ...formMethods,
    onChange,
    submitListing,
    resetForm,
    validateRewards,
    validateBasics
  };
};
