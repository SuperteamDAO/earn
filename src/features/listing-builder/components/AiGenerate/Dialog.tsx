import { useCompletion } from '@ai-sdk/react';
import { type BountyType } from '@prisma/client';
import { useMutation } from '@tanstack/react-query';
import { useSetAtom } from 'jotai';
import { marked } from 'marked';
import { type ReactNode, useEffect, useState } from 'react';
import { useWatch } from 'react-hook-form';

import { type TRewardsGenerateResponse } from '@/app/api/sponsor-dashboard/ai-generate/rewards/route';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { type Skills } from '@/interface/skills';
import { api } from '@/lib/api';

import { descriptionKeyAtom, skillsKeyAtom } from '../../atoms';
import { useListingForm } from '../../hooks';
import { type TEligibilityQuestion } from '../../types/schema';
import { calculateTotalRewardsForPodium } from '../../utils/rewards';
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
  const setSkillsKey = useSetAtom(skillsKeyAtom);
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
      inputReward,
      type,
    }: {
      description: string;
      inputReward: string;
      type: BountyType;
    }) =>
      (
        await api.post<TRewardsGenerateResponse>(
          '/api/sponsor-dashboard/ai-generate/rewards',
          {
            description,
            inputReward,
            type,
          },
        )
      ).data,
  });

  const {
    data: skills,
    mutateAsync: callSkills,
    reset: resetSkills,
    isIdle: isSkillsIdle,
    isError: isSkillsError,
    isPending: isSkillsPending,
  } = useMutation({
    mutationFn: async ({ description }: { description: string }) =>
      (
        await api.post<Skills>('/api/sponsor-dashboard/ai-generate/skills', {
          description,
        })
      ).data,
  });

  const handleFormSubmit = async (data: AiGenerateFormValues) => {
    setFormData(data);

    const completedDescription = await completeDescription('', {
      body: data,
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
        inputReward: data.rewards,
        type,
      });

      callSkills({ description: completedDescription });
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
    resetSkills();
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
            skills={skills || []}
            isSkillsIdle={isSkillsIdle}
            isSkillsError={isSkillsError}
            isSkillsPending={isSkillsPending}
            rewards={rewards}
            isRewardsIdle={isRewardsIdle}
            isRewardsError={isRewardsError}
            isRewardsPending={isRewardsPending}
            onInsert={() => {
              listingForm.setValue('description', parsedDescription);
              listingForm.setValue('eligibility', eligibilityQuestions);
              if (skills) {
                listingForm.setValue('skills', skills);
              }
              if (rewards) {
                listingForm.setValue(
                  'compensationType',
                  rewards.compensationType,
                );
                listingForm.setValue('token', rewards.token);
                if (rewards.maxBonusSpots)
                  listingForm.setValue(
                    'maxBonusSpots',
                    rewards.maxBonusSpots || 0,
                  );
                if (rewards.compensationType === 'fixed') {
                  listingForm.setValue('rewards', rewards.rewards || {});
                  const totalReward = calculateTotalRewardsForPodium(
                    rewards?.rewards || {},
                    rewards?.maxBonusSpots || 0,
                  );
                  listingForm.setValue('rewardAmount', totalReward);
                }
                if (rewards.compensationType === 'range') {
                  listingForm.setValue(
                    'minRewardAsk',
                    rewards.minRewardAsk || 0,
                  );
                  listingForm.setValue(
                    'maxRewardAsk',
                    rewards.maxRewardAsk || 0,
                  );
                }
              }
              setDescriptionKey((s) => {
                if (typeof s === 'number') return s + 1;
                else return 1;
              });
              setSkillsKey((s) => {
                if (typeof s === 'number') return s + 1;
                else return 1;
              });
              setOpen(false);
            }}
            onBack={() => {
              setStage('form');
              resetEligibilityQuestions();
              resetRewards();
              resetSkills();
              setDescription('');
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
