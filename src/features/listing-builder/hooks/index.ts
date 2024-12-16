import { zodResolver } from '@hookform/resolvers/zod';
import { type Hackathon } from '@prisma/client';
import { useQueryClient } from '@tanstack/react-query';
import { useAtom, useAtomValue } from 'jotai';
import debounce from 'lodash.debounce';
import { useCallback, useEffect, useRef } from 'react';
import { useForm, useFormContext, type UseFormReturn } from 'react-hook-form';
import { z } from 'zod';

import {
  draftQueueAtom,
  hackathonAtom,
  hideAutoSaveAtom,
  isDraftSavingAtom,
  isEditingAtom,
  isGodAtom,
  isSTAtom,
  saveDraftMutationAtom,
  submitListingMutationAtom,
} from '../atoms';
import { type ListingFormData } from '../types';
import {
  createListingFormSchema,
  createListingRefinements,
} from '../types/schema';
import { getListingDefaults, refineReadyListing } from '../utils/form';

interface UseListingFormReturn extends UseFormReturn<ListingFormData> {
  saveDraft: () => void;
  submitListing: () => Promise<ListingFormData>;
  resetForm: () => void;
  validateRewards: () => Promise<boolean>;
  validateBasics: () => Promise<boolean>;
}

export const useListingForm = (
  defaultValues?: ListingFormData,
  hackathon?: Hackathon,
): UseListingFormReturn => {
  let formMethods: UseFormReturn<ListingFormData> | null = null;
  let isNewFormInitialized = false;

  try {
    //eslint-disable-next-line
    formMethods = useFormContext<ListingFormData>();
  } catch (error) {
    // No existing form context
  }

  const isGod = useAtomValue(isGodAtom);
  const isEditing = useAtomValue(isEditingAtom);
  const isST = useAtomValue(isSTAtom);

  const hackathonAtomed = useAtomValue(hackathonAtom);
  hackathon = hackathon || hackathonAtomed;
  const formSchema = createListingFormSchema({
    isGod,
    isEditing,
    isST,
    pastListing: defaultValues as any,
    hackathon: hackathon,
  });
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

  const queryClient = useQueryClient();
  const saveDraftMutation = useAtomValue(saveDraftMutationAtom);
  const submitListingMutation = useAtomValue(submitListingMutationAtom);
  const [, setDraftSaving] = useAtom(isDraftSavingAtom);

  const [queueRef, setQueueRef] = useAtom(draftQueueAtom);

  const [, setHideAutoSave] = useAtom(hideAutoSaveAtom);
  const queueRefRef = useRef(queueRef);

  useEffect(() => {
    queueRefRef.current = queueRef;
  }, [queueRef]);

  // queue ensures eeach call for auto save is sent synchronously
  const processSaveQueue = useCallback(async () => {
    if (isEditing) return;
    setDraftSaving(true);
    if (queueRefRef.current.isProcessing) {
      setQueueRef((q) => ({
        ...q,
        shouldProcessNext: true,
      }));
      return;
    }

    setQueueRef((q) => ({
      ...q,
      shouldProcessNext: false,
      isProcessing: true,
    }));
    try {
      const dataToSave = getValues();
      const data = await saveDraftMutation.mutateAsync(dataToSave);
      setHideAutoSave(false);
      formMethods.setValue('id', data.id);
      if (!dataToSave.slug) formMethods.setValue('slug', data.slug);
      setQueueRef((q) => ({
        ...q,
      }));
    } catch (error) {
    } finally {
      setQueueRef((q) => ({
        ...q,
        isProcessing: false,
      }));
      setDraftSaving(false);
      // Check if we need to process another save
      if (queueRefRef.current.shouldProcessNext) {
        // Use setTimeout to break the call stack and ensure queue state is updated
        setTimeout(() => {
          void processSaveQueue();
        }, 0);
      }
    }
  }, [queueRefRef, isEditing]);

  const debouncedSaveRef = useRef<ReturnType<typeof debounce>>();

  useEffect(() => {
    debouncedSaveRef.current = debounce(() => {
      void processSaveQueue();
    }, 1000);
  }, [processSaveQueue]);

  const onChange = useCallback(() => {
    setHideAutoSave(true);
    if (!isEditing) debouncedSaveRef.current?.();
  }, []);

  const submitListing = useCallback(async () => {
    const formData = refineReadyListing(getValues());
    const data = await submitListingMutation.mutateAsync(formData);
    queryClient.invalidateQueries({
      queryKey: ['sponsor-dashboard-listing', data.slug],
    });
    return data;
  }, [getValues, submitListingMutation]);

  const resetForm = useCallback(() => {
    const defaultValues = getListingDefaults({
      isGod,
      isEditing,
      isST,
      hackathon,
      type: getValues().type,
    });
    reset({
      ...getValues(),
      ...defaultValues,
    });
  }, [reset]);

  type ValidationFields = Partial<Record<keyof ListingFormData, true>>;

  const validateFields = useCallback(
    async (fields: ValidationFields) => {
      const values = formMethods.getValues();

      // Transform array rewards if is array
      if ('rewards' in fields && Array.isArray(values.rewards)) {
        const rewardsObject: Record<string, number> = {};
        let index = 1;
        for (const value of values.rewards.filter(Boolean)) {
          rewardsObject[index] = value;
          index += 1;
        }
        if (Object.keys(rewardsObject).length === 0) {
          rewardsObject[1] = NaN;
        }
        formMethods.setValue('rewards', rewardsObject);
        values.rewards = rewardsObject;
      }

      const innerSchema = formSchema._def.schema;
      const partialSchema = innerSchema
        .pick(fields)
        .superRefine((data, ctx) => {
          createListingRefinements(data as any, ctx, hackathon);
        });

      try {
        formMethods.clearErrors(
          Object.keys(fields) as Array<keyof ListingFormData>,
        );
        await partialSchema.parseAsync(values);
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
