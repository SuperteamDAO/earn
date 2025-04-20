import { useCompletion } from '@ai-sdk/react';
import { type BountyType } from '@prisma/client';
import { useMutation } from '@tanstack/react-query';
import { useSetAtom } from 'jotai';
import { marked } from 'marked';
import { type ReactNode, useEffect, useState } from 'react';
import { useWatch } from 'react-hook-form';

import { type TRewardsGenerateResponse } from '@/app/api/sponsor-dashboard/ai-generate/rewards/route';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { api } from '@/lib/api';

import { descriptionKeyAtom } from '../../atoms';
import { useListingForm } from '../../hooks';
import { type TEligibilityQuestion } from '../../types/schema';
import { AiGenerateForm } from './Form';
import { AiGenerateResult } from './Result';
import { type AiGenerateFormValues } from './schema';

interface AIDescriptionDialogProps {
  children: ReactNode;
}

export function AiGenerateDialog({ children }: AIDescriptionDialogProps) {
  const listingForm = useListingForm();
  const type = useWatch({
    control: listingForm.control,
    name: 'type',
  });
  const [stage, setStage] = useState<'form' | 'result'>('form');
  const [open, setOpen] = useState(false);
  const setDescriptionKey = useSetAtom(descriptionKeyAtom);
  const [parsedDescription, setParsedDescription] = useState('');
  const [formData, setFormData] = useState<Partial<AiGenerateFormValues>>({
    companyDescription: '',
    scopeOfWork: '',
    rewards: '',
    requirements: '',
  });

  const {
    complete: completeDescription,
    completion: description,
    setCompletion: setDescription,
    isLoading: isDescriptionLoading,
    error: isDescriptionError,
  } = useCompletion({
    api: '/api/sponsor-dashboard/ai-generate/description',
    onResponse: () => {
      // Move to result stage as soon as we start getting a response
      setStage('result');
    },
    onError: (err) => {
      console.error('Error in completion:', err);
    },
  });

  useEffect(() => {
    const awaitedParse = async () => {
      setParsedDescription(
        await marked.parse(description || '', { gfm: true }),
      );
    };
    awaitedParse();
  }, [description]);

  const {
    data: eligibilityQuestions,
    mutateAsync: callEligibilityQuestions,
    reset: resetEligibilityQuestions,
    isIdle: isEligibilityQuestionsIdle,
    isError: isEligibilityQuestionsError,
    isPending: isEligibilityQuestionsPending,
  } = useMutation({
    mutationFn: async ({
      description,
      type,
    }: {
      description: string;
      type: BountyType;
    }) =>
      (
        await api.post<TEligibilityQuestion[]>(
          '/api/sponsor-dashboard/ai-generate/questions',
          {
            description,
            type,
          },
        )
      ).data,
  });

  const {
    data: rewards,
    mutateAsync: callRewards,
    reset: resetRewards,
    isIdle: isRewardsIdle,
    isError: isRewardsError,
    isPending: isRewardsPending,
  } = useMutation({
    mutationFn: async ({
      description,
      type,
    }: {
      description: string;
      type: BountyType;
    }) =>
      (
        await api.post<TRewardsGenerateResponse>(
          '/api/sponsor-dashboard/ai-generate/rewards',
          {
            description,
            type,
          },
        )
      ).data,
  });

  const handleFormSubmit = async (data: AiGenerateFormValues) => {
    setFormData(data);

    const completedDescription = await completeDescription('', {
      body: {
        companyDescription: data.companyDescription,
        scopeOfWork: data.scopeOfWork,
        rewards: data.rewards,
        requirements: data.requirements,
      },
    });

    if (completedDescription) {
      if (type !== 'hackathon') {
        callEligibilityQuestions({
          description: completedDescription,
          type,
        });
      }
      callRewards({
        description: completedDescription,
        type,
      });
    }
  };

  const resetForm = () => {
    setFormData({
      companyDescription: '',
      scopeOfWork: '',
      rewards: '',
      requirements: '',
    });
    resetEligibilityQuestions();
    resetRewards();
    setDescription('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-160" hideCloseIcon>
        {stage === 'form' ? (
          <AiGenerateForm
            onSubmit={handleFormSubmit}
            initialData={formData}
            resetForm={resetForm}
          />
        ) : (
          <AiGenerateResult
            isDescriptionLoading={isDescriptionLoading}
            description={parsedDescription}
            isDescriptionError={Boolean(isDescriptionError)}
            eligibilityQuestions={eligibilityQuestions || []}
            isEligibilityQuestionsIdle={isEligibilityQuestionsIdle}
            isEligibilityQuestionsError={isEligibilityQuestionsError}
            isEligibilityQuestionsPending={isEligibilityQuestionsPending}
            rewards={rewards}
            isRewardsIdle={isRewardsIdle}
            isRewardsError={isRewardsError}
            isRewardsPending={isRewardsPending}
            onInsert={() => {
              listingForm.setValue('description', parsedDescription);
              listingForm.setValue('eligibility', eligibilityQuestions);
              setDescriptionKey((s) => {
                if (typeof s === 'number') return s + 1;
                else return 1;
              });
              setOpen(false);
            }}
            onBack={() => {
              setStage('form');
              resetEligibilityQuestions();
              resetRewards();
              setDescription('');
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
