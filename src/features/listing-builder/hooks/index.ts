import { useForm, useFormContext, UseFormReturn } from "react-hook-form";
import { createListingRefinements, ListingFormData } from "../types";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { formSchemaAtom, isDraftSavingAtom, isDuplicatingAtom, isEditingAtom, isGodAtom, isSTAtom, saveDraftMutationAtom, submitListingMutationAtom } from "../atoms";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import debounce from "lodash.debounce";
import { Bounties } from "@prisma/client";

interface SaveQueueState {
  isProcessing: boolean;
  shouldProcessNext: boolean;
  id?: string;
}
const queueRef: SaveQueueState = {
  isProcessing: false,
  shouldProcessNext: false
};

interface UseListingFormReturn extends UseFormReturn<ListingFormData> {
  onChange: () => void;
  submitListing: () => Promise<Bounties>;
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
  const setDraftSaving = useSetAtom(isDraftSavingAtom)

  const processSaveQueue = async () => {
    setDraftSaving(true)
    if (queueRef.isProcessing) {
      queueRef.shouldProcessNext = true;
      return;
    }

    queueRef.isProcessing = true;
    queueRef.shouldProcessNext = false;

    try {
      const dataToSave = getValues();
      const data = await saveDraftMutation.mutateAsync({
        ...dataToSave,
        id: queueRef.id,
      });
      console.log('before save',dataToSave)
      console.log('data',data)
      
      formMethods.setValue('id', data.id);
      if(!dataToSave.slug) formMethods.setValue('slug', data.slug);
      queueRef.id = data.id;

    } catch (error) {
      console.error('Error saving draft:', error);
    } finally {
      queueRef.isProcessing = false;
      
      setDraftSaving(false)
      // Check if we need to process another save
      if (queueRef.shouldProcessNext) {
        // Use setTimeout to break the call stack and ensure queue state is updated
        setTimeout(() => {
          void processSaveQueue();
        }, 0);
      }
    }
  };

  // Create the debounced function ref that persists across renders
  const debouncedSaveRef = useRef<ReturnType<typeof debounce>>();
  
  // Initialize the debounced function once
  useEffect(() => {
    debouncedSaveRef.current = debounce(() => {
    console.log('debounce')
      void processSaveQueue();
    }, 1000);
  }, []); // Empty dependency array - only create once

  const onChange = useCallback(() => {
    setDraftSaving(true)
    debouncedSaveRef.current?.();
  }, []);

  const submitListing = useCallback(async () => {
    const formData = getValues();
    return await submitListingMutation.mutateAsync(formData);
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

  return {
    ...formMethods,
    onChange,
    submitListing,
    resetForm,
    validateRewards,
    validateBasics,
  };
};
