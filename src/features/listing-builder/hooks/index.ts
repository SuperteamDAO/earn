import { zodResolver } from '@hookform/resolvers/zod';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import debounce from 'lodash.debounce';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useRef } from 'react';
import { useForm, useFormContext, type UseFormReturn } from 'react-hook-form';
import { z } from 'zod';

import {
  draftQueueAtom,
  isDraftSavingAtom,
  isEditingAtom,
  isGodAtom,
  isSTAtom,
  saveDraftMutationAtom,
  submitListingMutationAtom,
} from '../atoms';
import {
  createListingFormSchema,
  createListingRefinements,
  type ListingFormData,
} from '../types';
import { refineReadyListing } from '../utils';

interface UseListingFormReturn extends UseFormReturn<ListingFormData> {
  saveDraft: () => void;
  submitListing: () => Promise<ListingFormData>;
  resetForm: () => void;
  validateRewards: () => Promise<boolean>;
  validateBasics: () => Promise<boolean>;
}

export const useListingForm = (
  defaultValues?: ListingFormData,
): UseListingFormReturn => {
  let formMethods: UseFormReturn<ListingFormData> | null = null;
  let isNewFormInitialized = false;

  const router = useRouter();

  try {
    //eslint-disable-next-line
    formMethods = useFormContext<ListingFormData>();
  } catch (error) {
    // No existing form context
  }

  const isGod = useAtomValue(isGodAtom);
  const isEditing = useAtomValue(isEditingAtom);
  const isST = useAtomValue(isSTAtom);

  const formSchema = createListingFormSchema(
    isGod,
    isEditing,
    isST,
    defaultValues as any,
  );
  if (!formMethods || !Object.keys(formMethods).length) {
    //eslint-disable-next-line
    formMethods = useForm<ListingFormData>({
      resolver: zodResolver(formSchema),
      defaultValues,
      mode: 'onTouched',
    });
    isNewFormInitialized = true;
  }

  const { getValues, reset } = formMethods;

  const saveDraftMutation = useAtomValue(saveDraftMutationAtom);
  const submitListingMutation = useAtomValue(submitListingMutationAtom);
  const setDraftSaving = useSetAtom(isDraftSavingAtom);

  const [queueRef, setQueueRef] = useAtom(draftQueueAtom);
  const processSaveQueue = async () => {
    setDraftSaving(true);
    if (queueRef.isProcessing) {
      // queueRef.shouldProcessNext = true;
      setQueueRef((q) => ({
        ...q,
        shouldProcessNext: true,
      }));
      return;
    }

    // queueRef.isProcessing = true;
    // queueRef.shouldProcessNext = false;
    setQueueRef((q) => ({
      ...q,
      shouldProcessNext: false,
      isProcessing: true,
    }));
    try {
      const dataToSave = getValues();
      const data = await saveDraftMutation.mutateAsync(dataToSave);
      console.log('before save', dataToSave);
      console.log('data', data);

      formMethods.setValue('id', data.id);
      if (!dataToSave.slug) formMethods.setValue('slug', data.slug);
      queueRef.id = data.id;

      console.log('asPath', router.asPath);
      console.log('data slug', data.slug);
      // if(router.asPath.split('/')[4] === 'edit') {
      //   console.log('replacee')
      //   router.replace(`/dashboard/listings/${data.slug}/edit/`,{},{
      //     shallow: true,
      //   } )
      // }
    } catch (error) {
      console.error('Error saving draft:', error);
    } finally {
      // queueRef.isProcessing = false;
      setQueueRef((q) => ({
        ...q,
        isProcessing: false,
      }));
      setDraftSaving(false);
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
      console.log('debounce');
      void processSaveQueue();
    }, 1000);
  }, []); // Empty dependency array - only create once

  const onChange = useCallback(() => {
    // setDraftSaving(true)
    if (!isEditing) debouncedSaveRef.current?.();
  }, []);

  const submitListing = useCallback(async () => {
    const formData = refineReadyListing(getValues());
    return await submitListingMutation.mutateAsync(formData);
  }, [getValues, submitListingMutation]);

  const resetForm = useCallback(() => {
    reset();
  }, [reset]);

  type ValidationFields = Partial<Record<keyof ListingFormData, true>>;

  const validateFields = useCallback(
    async (fields: ValidationFields) => {
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
      const partialSchema = innerSchema
        .pick(fields)
        .superRefine((data, ctx) => {
          createListingRefinements(data as any, ctx);
        });

      try {
        await partialSchema.parseAsync(values);
        // Only clear errors for the fields we validated
        formMethods.clearErrors(
          Object.keys(fields) as Array<keyof ListingFormData>,
        );
        return true;
      } catch (error) {
        console.log('validation error', error);
        if (error instanceof z.ZodError) {
          error.errors.forEach((err) => {
            const fieldName = err.path.join('.') as keyof ListingFormData;
            formMethods.setError(fieldName, {
              type: err.code,
              message: err.message,
            });
          });
        }
        return false;
      }
    },
    [formMethods, formSchema, isGod, isEditing, isST],
  );

  const validateRewards = () =>
    validateFields({
      type: true,
      compensationType: true,
      token: true,
      rewardAmount: true,
      rewards: true,
      minRewardAsk: true,
      maxRewardAsk: true,
      maxBonusSpots: true,
    });

  const validateBasics = () =>
    validateFields({
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
        'useListingForm: Initialized a new form instance because no form context was found. If this is unintended, ensure your component is wrapped with FormProvider.',
      );
    }
  }, [isNewFormInitialized]);

  return {
    ...formMethods,
    saveDraft: onChange,
    submitListing,
    resetForm,
    validateRewards,
    validateBasics,
  };
};
