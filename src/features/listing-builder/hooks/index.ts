import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import debounce from 'lodash.debounce';
import { useCallback, useEffect, useRef } from 'react';
import { useForm, useFormContext, type UseFormReturn } from 'react-hook-form';
import { z } from 'zod';

import { type HackathonModel } from '@/prisma/models/Hackathon';
import { dayjs } from '@/utils/dayjs';

import {
  descriptionKeyAtom,
  draftQueueAtom,
  hackathonsAtom,
  hideAutoSaveAtom,
  isDraftSavingAtom,
  isEditingAtom,
  isGodAtom,
  isSTAtom,
  saveDraftMutationAtom,
  skillsKeyAtom,
  submitListingMutationAtom,
} from '../atoms';
import {
  type ListingFormData,
  type SubmitListingResponse,
  type ValidationFields,
} from '../types';
import {
  createListingFormSchema,
  createListingRefinements,
} from '../types/schema';
import { getListingDefaults, refineReadyListing } from '../utils/form';

export interface UseListingFormReturn extends UseFormReturn<ListingFormData> {
  saveDraft: () => void;
  submitListing: () => Promise<SubmitListingResponse>;
  resetForm: () => void;
  validateRewards: () => Promise<boolean>;
  validateBasics: () => Promise<boolean>;
  validateEligibilityQuestions: () => Promise<boolean>;
}

export const useListingForm = (
  defaultValues?: ListingFormData,
  hackathons?: HackathonModel[],
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

  const setDescriptionKey = useSetAtom(descriptionKeyAtom);
  const setSkillsKey = useSetAtom(skillsKeyAtom);

  const hackathonsAtomed = useAtomValue(hackathonsAtom);
  hackathons = hackathons || hackathonsAtomed;
  const formSchema = createListingFormSchema({
    isGod,
    isEditing,
    isST,
    pastListing: defaultValues as any,
    hackathons: hackathons,
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

  // queue ensures each call for auto save is sent synchronously
  const processSaveQueue = useCallback(async () => {
    console.log('[DRAFT_DEBUG] processSaveQueue called', {
      isEditing,
      isProcessing: queueRefRef.current.isProcessing,
      shouldProcessNext: queueRefRef.current.shouldProcessNext,
      stack: new Error().stack?.split('\n').slice(1, 5).join('\n'),
    });

    if (isEditing) {
      console.log('[DRAFT_DEBUG] Skipping - isEditing=true');
      return;
    }
    if (queueRefRef.current.isProcessing) {
      console.log('[DRAFT_DEBUG] Already processing, queuing next');
      setQueueRef((q) => ({
        ...q,
        shouldProcessNext: true,
      }));
      return;
    }

    console.log('[DRAFT_DEBUG] Starting save...');
    setDraftSaving(true);
    setQueueRef((q) => ({
      ...q,
      shouldProcessNext: false,
      isProcessing: true,
    }));
    try {
      const dataToSave = getValues();

      if (dataToSave.deadline) {
        if (!dataToSave.deadline.endsWith('Z'))
          dataToSave.deadline += dayjs().format('Z');
      }
      if (dataToSave.commitmentDate) {
        if (!dataToSave.commitmentDate.endsWith('Z'))
          dataToSave.commitmentDate += dayjs().format('Z');
      }
      console.log(
        '[DRAFT_DEBUG] Calling API with id:',
        dataToSave.id,
        'slug:',
        dataToSave.slug,
      );
      const data = await saveDraftMutation.mutateAsync(dataToSave);
      console.log(
        '[DRAFT_DEBUG] API success, returned id:',
        data.id,
        'slug:',
        data.slug,
      );
      setHideAutoSave(false);
      formMethods.setValue('id', data.id);
      if (!dataToSave.slug) formMethods.setValue('slug', data.slug);
      setQueueRef((q) => ({
        ...q,
      }));
    } catch (error) {
      console.log('[DRAFT_DEBUG] Error:', error);
    } finally {
      console.log(
        '[DRAFT_DEBUG] Finally block, shouldProcessNext:',
        queueRefRef.current.shouldProcessNext,
      );
      setDraftSaving(false);
      setQueueRef((q) => ({
        ...q,
        isProcessing: false,
      }));
      // Check if we need to process another save
      if (queueRefRef.current.shouldProcessNext) {
        console.log('[DRAFT_DEBUG] Processing queued save via setTimeout');
        // Use setTimeout to break the call stack and ensure queue state is updated
        setTimeout(() => {
          void processSaveQueue();
        }, 0);
      }
    }
  }, [queueRefRef, isEditing]);

  const debouncedSaveRef = useRef<ReturnType<typeof debounce>>(undefined);

  useEffect(() => {
    debouncedSaveRef.current = debounce(() => {
      void processSaveQueue();
    }, 1000);
  }, [processSaveQueue]);

  const onChange = useCallback(() => {
    console.log('[DRAFT_DEBUG] saveDraft() called', {
      isEditing,
      stack: new Error().stack?.split('\n').slice(1, 4).join('\n'),
    });
    setHideAutoSave(true);
    if (!isEditing) debouncedSaveRef.current?.();
  }, [isEditing]);

  const submitListing = useCallback(async () => {
    const formData = refineReadyListing(getValues());
    const data = await submitListingMutation.mutateAsync(formData);
    queryClient.invalidateQueries({
      queryKey: ['sponsor-dashboard-listing', data.slug],
    });
    return data;
  }, [getValues, submitListingMutation]);

  const resetForm = useCallback(() => {
    if (typeof window !== 'undefined' && window.__clearImageCleanup) {
      try {
        window.__clearImageCleanup();
      } catch (error) {
        console.error('Failed to clear image cleanup on reset:', error);
      }
    }

    const defaultValues = getListingDefaults({
      isGod,
      isEditing,
      isST,
      hackathons,
      type: getValues().type,
      hackathonId: undefined,
    });
    reset({
      ...getValues(),
      ...defaultValues,
      id: getValues().id,
      slug: getValues().slug,
      eligibility: [],
      skills: [],
    });
    setDescriptionKey((s) => {
      if (typeof s === 'number') return s + 1;
      else return 1;
    });
    setSkillsKey((s) => {
      if (typeof s === 'number') return s + 1;
      else return 1;
    });
  }, [reset]);

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
          createListingRefinements(data as any, ctx, hackathons, fields);
        });

      try {
        formMethods.clearErrors(
          Object.keys(fields) as Array<keyof ListingFormData>,
        );
        await partialSchema.parseAsync(values);
        return true;
      } catch (error) {
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

  const validateEligibilityQuestions = () =>
    validateFields({
      type: true,
      compensationType: true,
      eligibility: true,
    });

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
      commitmentDate: true,
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
    validateEligibilityQuestions,
  };
};
