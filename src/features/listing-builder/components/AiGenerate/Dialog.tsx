import { useCompletion } from '@ai-sdk/react';
import { type BountyType } from '@prisma/client';
import { useMutation } from '@tanstack/react-query';
import { useSetAtom } from 'jotai';
import { marked } from 'marked';
import { usePostHog } from 'posthog-js/react';
import { type ReactNode, useEffect, useState } from 'react';
import { useWatch } from 'react-hook-form';

import {
  type RewardInputSchema,
  type TRewardsGenerateResponse,
} from '@/app/api/sponsor-dashboard/ai-generate/rewards/route';
import { type TTitleGenerateResponse } from '@/app/api/sponsor-dashboard/ai-generate/title/route';
import { type TTokenGenerateResponse } from '@/app/api/sponsor-dashboard/ai-generate/token/route';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { tokenList } from '@/constants/tokenList';
import { type Skills } from '@/interface/skills';
import { api } from '@/lib/api';

import { fetchTokenUSDValue } from '@/features/wallet/utils/fetchTokenUSDValue';

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
  const posthog = usePostHog();
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
    data: title,
    mutateAsync: callTitle,
    reset: resetTitle,
    isIdle: isTitleIdle,
    isError: isTitleError,
    isPending: isTitlePending,
  } = useMutation({
    mutationFn: async ({
      description,
      type,
    }: {
      description: string;
      type: BountyType;
    }) =>
      (
        await api.post<TTitleGenerateResponse>(
          '/api/sponsor-dashboard/ai-generate/title',
          { description, type },
        )
      ).data,
  });

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
      inputRequirements,
      type,
    }: {
      description: string;
      inputRequirements: string;
      type: BountyType;
    }) =>
      (
        await api.post<TEligibilityQuestion[]>(
          '/api/sponsor-dashboard/ai-generate/questions',
          {
            description,
            inputRequirements,
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
    mutationFn: async (input: RewardInputSchema) =>
      (
        await api.post<TRewardsGenerateResponse>(
          '/api/sponsor-dashboard/ai-generate/rewards',
          input,
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

  const {
    data: token,
    mutateAsync: callToken,
    reset: resetToken,
  } = useMutation({
    mutationFn: async ({ description }: { description: string }) =>
      (
        await api.post<TTokenGenerateResponse>(
          '/api/sponsor-dashboard/ai-generate/token',
          {
            description,
          },
        )
      ).data,
  });

  const handleFormSubmit = async (data: AiGenerateFormValues) => {
    posthog.capture('generate_ai listing builder');
    setFormData(data);

    const token =
      (
        await callToken({
          description: data.rewards,
        })
      )?.token || 'USDC';
    const tokenItem = tokenList.find((s) => s.tokenSymbol === token);
    const tokenUsdAmount = tokenItem
      ? await fetchTokenUSDValue(tokenItem.mintAddress)
      : 1;

    const completedDescription = await completeDescription('', {
      body: {
        ...data,
        token,
        tokenUsdAmount,
      },
    });

    if (completedDescription) {
      callTitle({
        description: completedDescription,
        type,
      });
      if (type !== 'hackathon') {
        callEligibilityQuestions({
          description: completedDescription,
          type,
          inputRequirements: data.requirements,
        });
      }
      callRewards({
        description: completedDescription,
        inputReward: data.rewards,
        type,
        token,
        tokenUsdValue: tokenUsdAmount,
      });

      callSkills({ description: completedDescription });
    }
  };

  const resetForm = () => {
    posthog.capture('reset_ai listing builder');
    setFormData({
      companyDescription: '',
      scopeOfWork: '',
      rewards: '',
      requirements: '',
    });
    resetEligibilityQuestions();
    resetRewards();
    resetSkills();
    resetToken();
    resetTitle();
    setDescription('');
  };

  useEffect(() => {
    setStage('form');
    resetEligibilityQuestions();
    resetRewards();
    resetSkills();
    resetToken();
    resetTitle();
    setDescription('');
  }, [type]);

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) posthog.capture('close_ai listing builder');
        setOpen(open);
      }}
    >
      <DialogTrigger
        asChild
        onClick={() => posthog.capture('open_ai listing builder')}
      >
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-160" hideCloseIcon>
        {stage === 'form' ? (
          <AiGenerateForm
            onSubmit={handleFormSubmit}
            initialData={formData}
            resetForm={resetForm}
          />
        ) : (
          <AiGenerateResult
            token={token?.token || 'USDC'}
            isDescriptionLoading={isDescriptionLoading}
            description={parsedDescription}
            isDescriptionError={Boolean(isDescriptionError)}
            title={title?.title || ''}
            isTitleIdle={isTitleIdle}
            isTitleError={isTitleError}
            isTitlePending={isTitlePending}
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
              posthog.capture('insert_ai listing builder');
              listingForm.setValue('description', parsedDescription);
              listingForm.setValue('eligibility', eligibilityQuestions);
              if (title?.title) listingForm.setValue('title', title?.title);
              if (skills) {
                listingForm.setValue('skills', skills);
              }
              if (rewards) {
                listingForm.setValue(
                  'compensationType',
                  rewards.compensationType,
                );
                listingForm.setValue('token', token?.token || 'USDC');
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
              listingForm.saveDraft();
              setOpen(false);
            }}
            onBack={() => {
              posthog.capture('back_ai listing builder');
              setStage('form');
              resetEligibilityQuestions();
              resetRewards();
              resetSkills();
              resetToken();
              resetTitle();
              setDescription('');
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
