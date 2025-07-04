import { useCompletion } from '@ai-sdk/react';
import { Cross2Icon } from '@radix-ui/react-icons';
import { useMutation } from '@tanstack/react-query';
import { useAtom, useSetAtom } from 'jotai';
import { marked } from 'marked';
import { AnimatePresence, motion } from 'motion/react';
import posthog from 'posthog-js';
import { type ReactNode, useCallback, useEffect, useState } from 'react';
import { useWatch } from 'react-hook-form';
import { toast } from 'sonner';

import {
  type RewardInputSchema,
  type TRewardsGenerateResponse,
} from '@/app/api/sponsor-dashboard/ai-generate/rewards/route';
import { type TTitleGenerateResponse } from '@/app/api/sponsor-dashboard/ai-generate/title/route';
import { type TTokenGenerateResponse } from '@/app/api/sponsor-dashboard/ai-generate/token/route';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { tokenList } from '@/constants/tokenList';
import { type BountyType } from '@/interface/prisma/enums';
import { type Skills } from '@/interface/skills';
import { api } from '@/lib/api';
import { cn } from '@/utils/cn';
import { easeOutQuad } from '@/utils/easings';

import { fetchTokenUSDValue } from '@/features/wallet/utils/fetchTokenUSDValue';

import {
  descriptionKeyAtom,
  isAutoGenerateOpenAtom,
  skillsKeyAtom,
} from '../../atoms';
import { useListingForm } from '../../hooks';
import { type TEligibilityQuestion } from '../../types/schema';
import { calculateTotalRewardsForPodium } from '../../utils/rewards';
import { ProgressiveBlurOut } from './extras/ProgressiveBlurOut';
import { ProgressiveOpacityOut } from './extras/ProgressiveOpacityOut';
import { AiGenerateForm } from './Form';
import { AiGenerateLoading } from './Loading';
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
  const [stage, setStage] = useState<'form' | 'loading' | 'result'>('form');
  const [open, setOpen] = useAtom(isAutoGenerateOpenAtom);
  const setDescriptionKey = useSetAtom(descriptionKeyAtom);
  const setSkillsKey = useSetAtom(skillsKeyAtom);
  const [parsedDescription, setParsedDescription] = useState('');
  const [formData, setFormData] = useState<Partial<AiGenerateFormValues>>({
    companyDescription: '',
    scopeOfWork: '',
    rewards: '',
    requirements: '',
  });
  const [tokenUsdValue, setTokenUsdValue] = useState<number>(1);

  const [scrollEl, setScrollEl] = useState<HTMLDivElement | null>(null);

  const scrollCallbackRef = useCallback((node: HTMLDivElement | null) => {
    if (node !== null) {
      setScrollEl(node);
    }
  }, []);

  const {
    complete: completeDescription,
    completion: description,
    setCompletion: setDescription,
    isLoading: isDescriptionLoading,
    error: isDescriptionError,
  } = useCompletion({
    api: '/api/sponsor-dashboard/ai-generate/description',
    onError: (err) => {
      console.error('Error in completion:', err);
    },
  });

  useEffect(() => {
    const awaitedParse = async () => {
      const html = await marked.parse(description || '', { gfm: true });

      const processedHtml = html.replace(
        /<a\s+(?:[^>]*?\s+)?href=(["'])(.*?)\1/g,
        '<a href=$1$2$1 target="_blank" rel="noopener noreferrer"',
      );

      setParsedDescription(processedHtml);
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
    isSuccess: isTitleSuccess,
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
    isSuccess: isEligibilityQuestionsSuccess,
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
    isSuccess: isRewardsSuccess,
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
    isSuccess: isSkillsSuccess,
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

  const isAllSuccess =
    type === 'hackathon'
      ? isSkillsSuccess && isTitleSuccess && isRewardsSuccess
      : isSkillsSuccess &&
        isTitleSuccess &&
        isRewardsSuccess &&
        isEligibilityQuestionsSuccess;

  useEffect(() => {
    if (isAllSuccess) {
      const audio = new Audio('/assets/auto-generate-complete.wav');
      audio.play();
    }
  }, [isAllSuccess]);

  const handleFormSubmit = async (data: AiGenerateFormValues) => {
    setStage('loading');
    posthog.capture('generate_auto-generate');
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
    setTokenUsdValue(tokenUsdAmount);

    const completedDescription = await completeDescription('', {
      body: {
        ...data,
        requirements:
          data.requirements ||
          'General Requirements and criterias based on scope of work please',
        token,
        tokenUsdAmount,
      },
    });

    if (completedDescription) {
      const promises = [
        callTitle({
          description: completedDescription,
          type,
        }),
        ...(type !== 'hackathon'
          ? [
              callEligibilityQuestions({
                description: completedDescription,
                type,
                inputRequirements: data.requirements,
              }),
            ]
          : []),
        callRewards({
          description: completedDescription,
          inputReward: data.rewards,
          type,
          token,
          tokenUsdValue: tokenUsdAmount,
        }),
        callSkills({ description: completedDescription }),
      ];

      try {
        await Promise.all(promises);
        setStage('result');
      } catch (error) {
        console.error('Error generating content:', error);
        setStage('form');
        toast.error('Generation failed, please try again.');
      }
    }
  };

  const resetForm = () => {
    posthog.capture('reset_auto-generate');
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
        if (!open) posthog.capture('close_auto-generate');
        setOpen(open);
      }}
    >
      <DialogTrigger
        asChild
        onClick={() => posthog.capture('open_auto-generate')}
      >
        {children}
      </DialogTrigger>
      <DialogContent
        className={cn('gap-0 border-0 p-0 focus-visible:ring-0 sm:max-w-160')}
        style={{
          borderImageWidth: '0px !important',
        }}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        aria-describedby="Auto Generate Listing"
        hideCloseIcon
      >
        <div className="flex justify-between border-b px-6 py-4">
          <h2 className="text-base font-semibold text-slate-600">
            Use AI to generate your description
          </h2>
          <DialogClose className="-mr-2 rounded-md px-2 focus-visible:ring-1 focus-visible:ring-slate-400 focus-visible:outline-0">
            <Cross2Icon className="h-4 w-4 text-slate-400" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>
        <ScrollArea
          type="scroll"
          className="relative max-h-160 py-0"
          viewportProps={{
            ref: scrollCallbackRef,
            className: 'h-full *:h-full',
          }}
        >
          <div className={cn('h-full pt-2', stage === 'loading' && 'pt-0')}>
            <DialogTitle className="sr-only">Auto Generate Listing</DialogTitle>

            <AnimatePresence mode="popLayout">
              {stage === 'form' && (
                <motion.div
                  key="form"
                  initial={{
                    opacity: 0,
                    y: -20,
                    filter: 'blur(8px)',
                    scale: 0.95,
                  }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)', scale: 1 }}
                  exit={{ opacity: 0, y: 20, filter: 'blur(8px)', scale: 0.9 }}
                  transition={{ duration: 0.3, ease: easeOutQuad }}
                  className="h-full"
                >
                  <AiGenerateForm
                    onSubmit={handleFormSubmit}
                    initialData={formData}
                    resetForm={resetForm}
                    onClose={() => setOpen(false)}
                  />
                </motion.div>
              )}
              {stage === 'loading' && <AiGenerateLoading />}
              {stage === 'result' && (
                <motion.div
                  key="result"
                  initial={{
                    opacity: 0,
                    y: -20,
                    filter: 'blur(8px)',
                    scale: 0.95,
                  }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)', scale: 1 }}
                  exit={{ opacity: 0, y: 20, filter: 'blur(8px)', scale: 0.9 }}
                  transition={{ duration: 0.3, ease: easeOutQuad }}
                >
                  <AiGenerateResult
                    token={token?.token || 'USDC'}
                    tokenUsdValue={tokenUsdValue}
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
                    isEligibilityQuestionsPending={
                      isEligibilityQuestionsPending
                    }
                    skills={skills || []}
                    isSkillsIdle={isSkillsIdle}
                    isSkillsError={isSkillsError}
                    isSkillsPending={isSkillsPending}
                    rewards={rewards}
                    isRewardsIdle={isRewardsIdle}
                    isRewardsError={isRewardsError}
                    isRewardsPending={isRewardsPending}
                    onInsert={() => {
                      posthog.capture('insert_auto-generate');
                      listingForm.setValue('description', parsedDescription);
                      listingForm.setValue('eligibility', eligibilityQuestions);
                      if (title?.title)
                        listingForm.setValue('title', title?.title);
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
                          listingForm.setValue(
                            'rewards',
                            rewards.rewards || {},
                          );
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
                      posthog.capture('back_auto-generate');
                      setStage('form');
                      resetEligibilityQuestions();
                      resetRewards();
                      resetSkills();
                      resetToken();
                      resetTitle();
                      setDescription('');
                    }}
                    onClose={() => setOpen(false)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {stage === 'form' && <ProgressiveOpacityOut scrollEl={scrollEl} />}
          {stage === 'result' && <ProgressiveBlurOut scrollEl={scrollEl} />}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
