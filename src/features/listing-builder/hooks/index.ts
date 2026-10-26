/* oxlint-disable no-underscore-dangle -- the editor's image cleanup hooks are window globals */
import { zodResolver } from '@hookform/resolvers/zod';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import debounce from 'lodash.debounce';
import { useCallback, useEffect, useRef } from 'react';
import { useForm, useFormContext, type UseFormReturn } from 'react-hook-form';
import { z } from 'zod';

import { dayjs } from '@/utils/dayjs';

import {
  descriptionKeyAtom,
  draftQueueAtom,
  hideAutoSaveAtom,
  isDraftSavingAtom,
  isEditingAtom,
  isGodAtom,
  isSTAtom,
  skillsKeyAtom,
  submitStatusAtom,
} from '../atoms';
import { useBuilderData } from '../components/BuilderData';
import {
  saveDraftRequest,
  submitListingRequest,
} from '../queries/listing-requests';
import type {
  ListingFormData,
  SubmitListingResponse,
  ValidationFields,
} from '../types';
import type { BuilderHackathon } from '../types/builder';
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

function normalizeDraftPayload(values: ListingFormData): ListingFormData {
  const payload: ListingFormData = {
    ...values,
  };

  if (payload.deadline && !payload.deadline.endsWith('Z')) {
    payload.deadline += dayjs().format('Z');
  }
  if (payload.commitmentDate && !payload.commitmentDate.endsWith('Z')) {
    payload.commitmentDate += dayjs().format('Z');
  }

  return payload;
}

function getDraftPayloadKey(payload: ListingFormData): string {
  return JSON.stringify(payload);
}

export const useListingForm = (
  defaultValues?: ListingFormData,
  hackathons?: BuilderHackathon[],
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

  const builderData = useBuilderData();
  const allHackathons = hackathons || builderData.hackathons;
  const formSchema = createListingFormSchema({
    isGod,
    isEditing,
    isST,
    pastListing: defaultValues,
    hackathons: allHackathons,
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

  const setSubmitStatus = useSetAtom(submitStatusAtom);
  const [, setDraftSaving] = useAtom(isDraftSavingAtom);

  const [queueRef, setQueueRef] = useAtom(draftQueueAtom);

  const [, setHideAutoSave] = useAtom(hideAutoSaveAtom);
  const queueRefRef = useRef(queueRef);
  const lastSavedPayloadKeyRef = useRef<string | null>(null);
  const isHydratingSavedFieldsRef = useRef(false);

  useEffect(() => {
    queueRefRef.current = queueRef;
  }, [queueRef]);

  /* oxlint-disable react-hooks/exhaustive-deps, react/memo-dependencies -- Earn's
     autosave and validation keep their original dependencies (setters and
     refs are stable; widening them would re-create the debounced save). */
  // queue ensures each call for auto save is sent synchronously
  const processSaveQueue = useCallback(async () => {
    if (isEditing) {
      return;
    }

    const dataToSave = normalizeDraftPayload(getValues());
    const payloadKey = getDraftPayloadKey(dataToSave);

    if (queueRefRef.current.isProcessing) {
      setQueueRef((q) => ({
        ...q,
        shouldProcessNext: true,
      }));
      return;
    }

    if (payloadKey === lastSavedPayloadKeyRef.current) {
      setHideAutoSave(false);
      return;
    }

    setDraftSaving(true);
    setQueueRef((q) => ({
      ...q,
      shouldProcessNext: false,
      isProcessing: true,
    }));
    try {
      const data = await saveDraftRequest(dataToSave);
      lastSavedPayloadKeyRef.current = getDraftPayloadKey({
        ...dataToSave,
        id: data.id,
        slug: dataToSave.slug || data.slug,
      });
      setHideAutoSave(false);
      isHydratingSavedFieldsRef.current = true;
      try {
        if (formMethods.getValues('id') !== data.id) {
          formMethods.setValue('id', data.id);
        }
        if (!dataToSave.slug && formMethods.getValues('slug') !== data.slug) {
          formMethods.setValue('slug', data.slug);
        }
      } finally {
        isHydratingSavedFieldsRef.current = false;
      }
      setQueueRef((q) => ({
        ...q,
      }));
    } catch (error) {
      console.error('Saving the draft failed:', error);
    } finally {
      setDraftSaving(false);
      setQueueRef((q) => ({
        ...q,
        isProcessing: false,
      }));
      // Check if we need to process another save
      if (queueRefRef.current.shouldProcessNext) {
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
    if (isEditing || isHydratingSavedFieldsRef.current) return;

    const payloadKey = getDraftPayloadKey(normalizeDraftPayload(getValues()));
    if (payloadKey === lastSavedPayloadKeyRef.current) {
      return;
    }

    setHideAutoSave(true);
    debouncedSaveRef.current?.();
  }, [isEditing, getValues]);

  const submitListing = useCallback(async () => {
    const formData = refineReadyListing(getValues());
    setSubmitStatus('pending');
    try {
      const data = await submitListingRequest(formData, isEditing);
      setSubmitStatus('success');
      return data;
    } catch (error) {
      setSubmitStatus('error');
      throw error;
    }
  }, [getValues, isEditing, setSubmitStatus]);

  const resetForm = useCallback(() => {
    if (typeof window !== 'undefined' && window.__clearImageCleanup) {
      try {
        window.__clearImageCleanup();
      } catch (error) {
        console.error('Failed to clear image cleanup on reset:', error);
      }
    }

    const defaults = getListingDefaults({
      isGod,
      isEditing,
      isST,
      hackathons: allHackathons,
      type: getValues().type,
      hackathonId: undefined,
    });
    reset({
      ...getValues(),
      ...defaults,
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

      const innerSchema = formSchema.innerType();
      const partialSchema = innerSchema
        .pick(fields)
        .superRefine((data, ctx) => {
          void createListingRefinements(data, ctx, allHackathons, fields);
        });

      try {
        formMethods.clearErrors(
          // ValidationFields' keys are the form's.
          // oxlint-disable-next-line typescript/no-unsafe-type-assertion
          Object.keys(fields) as Array<keyof ListingFormData>,
        );
        await partialSchema.parseAsync(values);
        return true;
      } catch (error) {
        if (error instanceof z.ZodError) {
          error.errors.forEach((err) => {
            // zod's paths are the form's field names.
            // oxlint-disable-next-line typescript/no-unsafe-type-assertion
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

  /* oxlint-enable react-hooks/exhaustive-deps, react/memo-dependencies */

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
