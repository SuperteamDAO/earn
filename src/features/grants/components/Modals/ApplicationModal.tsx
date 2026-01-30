import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { Check, Loader2, Lock } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { type z } from 'zod';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DateTimePicker } from '@/components/ui/datetime-picker';
import { DialogTitle } from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { FormFieldWrapper } from '@/components/ui/form-field-wrapper';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useDisclosure } from '@/hooks/use-disclosure';
import { api } from '@/lib/api';
import { type GrantApplicationModel } from '@/prisma/models/GrantApplication';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';
import { dayjs } from '@/utils/dayjs';

import { usePopupAuth } from '@/features/auth/hooks/use-popup-auth';
import { SubmissionTerms } from '@/features/listings/components/Submission/SubmissionTerms';
import { SocialInput } from '@/features/social/components/SocialInput';
import { XVerificationModal } from '@/features/social/components/XVerificationModal';
import { extractSocialUsername } from '@/features/social/utils/extractUsername';
import { twitterRegex } from '@/features/social/utils/regex';
import {
  extractXHandle,
  isHandleVerified,
} from '@/features/social/utils/x-verification';

import { userApplicationQuery } from '../../queries/user-application';
import { type Grant } from '../../types';
import { grantApplicationSchema } from '../../utils/grantApplicationSchema';
import {
  extractLumaEventSlug,
  getLumaDisplayValue,
  LUMA_LABEL,
  ST_GRANT_COPY,
} from '../../utils/stGrant';

const getSteps = (isST: boolean) => [
  { title: 'Basics' },
  { title: 'Details' },
  { title: isST ? 'Outcomes' : 'Milestones' },
];

type FormData = z.infer<ReturnType<typeof grantApplicationSchema>>;

interface Props {
  grant: Grant;
  grantApplication: GrantApplicationModel | undefined;
  modalRef: React.RefObject<HTMLDivElement | null>;
  onClose: () => void;
}

export const ApplicationModal = ({
  grant,
  grantApplication,
  modalRef,
  onClose,
}: Props) => {
  const { user, refetchUser } = useUser();

  const [activeStep, setActiveStep] = useState(0);
  const [isTOSModalOpen, setIsTOSModalOpen] = useState(false);
  const [acknowledgementAccepted, setAcknowledgementAccepted] = useState(false);
  const [acknowledgementError, setAcknowledgementError] = useState('');
  const verificationModal = useDisclosure();
  const [verificationStatus, setVerificationStatus] = useState<
    'loading' | 'error'
  >('loading');
  const [verificationHandle, setVerificationHandle] = useState<string | null>(
    null,
  );

  const { id, token, minReward, maxReward, questions, isPro, isST } = grant;
  const tokenLabel = token ?? 'token';
  const isUserPro = user?.isPro;
  const isProGrant = isPro && isUserPro;
  const isNotEligibleForPro = isPro && !isUserPro;
  const steps = getSteps(isST === true);

  const dynamicResolver = useMemo(
    () =>
      zodResolver(
        grantApplicationSchema(
          minReward || 1,
          maxReward || 1,
          token || 'USDC',
          grant.questions,
          user,
          isST === true,
        ),
      ),
    [minReward, maxReward, token, grant.questions, user, isST],
  );

  const [isLoading, setIsLoading] = useState(false);
  const form = useForm<FormData>({
    resolver: dynamicResolver,
    defaultValues: {
      projectTitle: grantApplication?.projectTitle || '',
      projectOneLiner: grantApplication?.projectOneLiner || '',
      ask: grantApplication?.ask || undefined,
      walletAddress: grantApplication?.walletAddress,
      projectDetails: grantApplication?.projectDetails || '',
      projectTimeline: grantApplication?.projectTimeline
        ? dayjs(grantApplication?.projectTimeline, 'D MMMM YYYY').format(
            'YYYY-MM-DD',
          )
        : '',
      proofOfWork: grantApplication?.proofOfWork || '',
      milestones: grantApplication?.milestones || '',
      kpi: grantApplication?.kpi || '',
      twitter: grantApplication?.twitter
        ? extractSocialUsername('twitter', grantApplication?.twitter) || ''
        : extractSocialUsername('twitter', user?.twitter || '') || '',
      github: grantApplication?.github
        ? extractSocialUsername('github', grantApplication?.github) || ''
        : extractSocialUsername('github', user?.github || '') || '',
      telegram: extractSocialUsername('telegram', user?.telegram || '') || '',
      answers:
        Array.isArray(questions) && questions.length > 0
          ? questions.map((q) => ({
              question: q.question,
              answer:
                (
                  grantApplication?.answers as Array<{
                    question: string;
                    answer: string;
                  }>
                )?.find((a) => a.question === q.question)?.answer || '',
            }))
          : [],
      lumaLink: (grantApplication as any)?.lumaLink || '',
      expenseBreakdown: (grantApplication as any)?.expenseBreakdown || '',
    },
  });

  const twitterValue = form.watch('twitter');

  const normalizedTwitterValue = useMemo(
    () => (twitterValue || '').trim(),
    [twitterValue],
  );

  const isPlainUsernameValid = useMemo(() => {
    return /^[A-Za-z0-9_]{1,15}$/.test(normalizedTwitterValue);
  }, [normalizedTwitterValue]);

  const isProfileUrlValid = useMemo(() => {
    return twitterRegex.test(normalizedTwitterValue);
  }, [normalizedTwitterValue]);

  const isValidXProfileInput = useMemo(() => {
    if (!normalizedTwitterValue) return false;
    return isPlainUsernameValid || isProfileUrlValid;
  }, [normalizedTwitterValue, isPlainUsernameValid, isProfileUrlValid]);

  const xHandleForVerification = useMemo(() => {
    if (!isValidXProfileInput) return null;
    const urlToParse = isPlainUsernameValid
      ? `https://x.com/${normalizedTwitterValue}`
      : normalizedTwitterValue;
    return extractXHandle(urlToParse);
  }, [isValidXProfileInput, isPlainUsernameValid, normalizedTwitterValue]);

  const needsXVerification = useMemo(() => {
    if (!xHandleForVerification) return false;
    const verifiedHandles = user?.linkedTwitter || [];
    return !isHandleVerified(xHandleForVerification, verifiedHandles);
  }, [xHandleForVerification, user?.linkedTwitter]);

  const isXVerified = useMemo(() => {
    if (!xHandleForVerification) return false;
    const verifiedHandles = user?.linkedTwitter || [];
    return isHandleVerified(xHandleForVerification, verifiedHandles);
  }, [xHandleForVerification, user?.linkedTwitter]);

  useEffect(() => {
    if (twitterValue && !isValidXProfileInput) {
      form.setError('twitter', {
        type: 'manual',
        message: 'Please add a valid X profile link',
      });
      return;
    }

    if (isValidXProfileInput && needsXVerification) {
      form.setError('twitter', {
        type: 'manual',
        message: 'We need to verify that you own this X account',
      });
      return;
    }

    form.clearErrors('twitter');
  }, [twitterValue, isValidXProfileInput, needsXVerification, form]);

  const { signIn: popupSignIn } = usePopupAuth();

  const handleVerifyClick = async () => {
    if (!isValidXProfileInput) {
      form.setError('twitter', {
        type: 'manual',
        message: 'Please add a valid X profile link',
      });
      return;
    }

    const urlToParse = isPlainUsernameValid
      ? `https://x.com/${normalizedTwitterValue}`
      : normalizedTwitterValue;
    const handle = extractXHandle(urlToParse);
    if (!handle) return;

    try {
      setVerificationStatus('loading');
      setVerificationHandle(handle);
      verificationModal.onOpen();

      const success = await popupSignIn('twitter');

      if (success) {
        let attempts = 0;
        const maxAttempts = 5;
        const pollForUpdate = async (): Promise<boolean> => {
          const { data: freshUser } = await refetchUser();

          const currentVerifiedHandles = freshUser?.linkedTwitter || [];
          const isNowVerified = isHandleVerified(
            handle,
            currentVerifiedHandles,
          );

          if (isNowVerified) {
            form.trigger('twitter');
            setVerificationHandle(null);
            verificationModal.onClose();
            return true;
          }

          attempts++;
          if (attempts >= maxAttempts) {
            setVerificationStatus('error');
            return false;
          }

          const delay = Math.min(500 * Math.pow(2, attempts - 1), 5000);
          await new Promise((resolve) => setTimeout(resolve, delay));
          return pollForUpdate();
        };

        await pollForUpdate();
      } else {
        setVerificationStatus('error');
      }
    } catch (error: any) {
      console.error('X verification failed:', error);
      setVerificationStatus('error');
    }
  };

  const queryClient = useQueryClient();

  const validateAcknowledgement = () => {
    if (!grantApplication && !acknowledgementAccepted) {
      setAcknowledgementError('Acknowledgement required');
      return false;
    }
    setAcknowledgementError('');
    return true;
  };

  const submitApplication = async (data: FormData) => {
    setIsLoading(true);
    try {
      const {
        projectTitle,
        projectOneLiner,
        ask,
        walletAddress,
        projectDetails,
        projectTimeline,
        proofOfWork,
        milestones,
        kpi,
        twitter,
        github,
        answers,
        telegram,
        lumaLink,
        expenseBreakdown,
      } = data as FormData & { lumaLink?: string; expenseBreakdown?: string };

      const apiAction = !!grantApplication ? 'update' : 'create';

      await api.post(`/api/grant-application/${apiAction}/`, {
        grantId: id,
        projectTitle,
        projectOneLiner,
        projectDetails,
        projectTimeline,
        proofOfWork,
        milestones,
        kpi,
        walletAddress,
        ask: ask || null,
        twitter,
        github,
        answers: answers || [],
        telegram: telegram || user?.telegram || '',
        ...(isST && {
          lumaLink,
          expenseBreakdown,
        }),
      });

      form.reset();
      await queryClient.invalidateQueries({
        queryKey: userApplicationQuery(id).queryKey,
      });

      await refetchUser();

      toast.success(
        grantApplication
          ? 'Application updated successfully!'
          : 'Application submitted successfully!',
      );

      onClose();
    } catch (e) {
      setIsLoading(false);
      toast.error('Failed to submit application', {
        description:
          'Please try again later or contact support if the issue persists.',
      });
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    const fieldsToValidate: Record<
      number,
      (
        | keyof FormData
        | `answers.${number}.answer`
        | 'lumaLink'
        | 'expenseBreakdown'
      )[]
    > = {
      0: [
        'projectTitle',
        'projectOneLiner',
        'walletAddress',
        'ask',
        'telegram',
      ],
      1: [
        'projectDetails',
        ...(isST ? [] : ['projectTimeline' as keyof FormData]),
        ...(isST ? [] : ['proofOfWork' as keyof FormData]),
        'twitter',
        ...(isST ? [] : ['github' as keyof FormData]),
        ...(isST ? ['lumaLink' as const, 'expenseBreakdown' as const] : []),
        ...(questions?.map(
          (_: any, index: number) => `answers.${index}.answer` as const,
        ) || []),
      ],
      2: ['milestones', ...(isST ? [] : ['kpi' as keyof FormData])],
    };

    form.trigger(fieldsToValidate[activeStep]).then((isValid) => {
      if (isValid) {
        const nextStep = activeStep + 1;
        setActiveStep(nextStep);
        if (modalRef.current) {
          modalRef.current.scrollTop = 0;
        }
      }
    });
  };

  const handleBack = () => {
    const nextStep = activeStep - 1;
    setActiveStep(nextStep);
    if (modalRef.current) {
      modalRef.current.scrollTop = 0;
    }
  };

  const handleAutoFill = () => {
    form.setValue('walletAddress', user?.walletAddress || '');
  };

  const currentWalletAddress = form.watch('walletAddress');
  const isSameAsEmbeddedWallet =
    currentWalletAddress?.toLowerCase() === user?.walletAddress?.toLowerCase();

  const isSuperteamSponsor = grant.sponsor?.name
    ?.toLowerCase()
    .match(/superteam|solana/);

  const date = dayjs().format('YYYY-MM-DD');
  return (
    <div className="p-6 pb-0">
      <DialogTitle className="text-lg tracking-normal text-slate-700 sm:text-xl">
        {isST ? ST_GRANT_COPY.application.title : 'Grant Application'}
        <p className="mt-1 text-sm font-normal text-slate-500">
          {isST
            ? ST_GRANT_COPY.application.subtitle
            : "If you're working on a project that will help the sponsor's ecosystem grow, apply with your proposal here and we'll respond soon!"}
        </p>
        <Progress
          className={cn(
            'mt-6 h-[2px] bg-slate-200',
            isProGrant && '[&>div]:bg-zinc-800',
          )}
          value={(activeStep / steps.length) * 100 + 33}
        />
        <div className="mt-3 flex w-full items-center justify-between">
          {steps.map((step, i) => (
            <div
              className="flex items-center gap-1.5 text-sm sm:text-base"
              key={i}
            >
              <span
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full border text-sm',
                  i < activeStep
                    ? 'border-transparent'
                    : i - 1 < activeStep
                      ? 'border-slate-500'
                      : 'border-slate-300',
                  i < activeStep
                    ? isProGrant
                      ? 'bg-zinc-800'
                      : 'bg-brand-purple'
                    : 'bg-transparent',
                  i - 1 < activeStep ? 'text-slate-500' : 'text-slate-400',
                  i - 1 < activeStep ? 'font-medium' : 'font-normal',
                )}
              >
                {i < activeStep ? (
                  <Check className="h-4 w-4 text-white" />
                ) : (
                  i + 1
                )}
              </span>
              <span
                className={cn(
                  'text-md',
                  i - 1 < activeStep ? 'text-slate-600' : 'text-slate-500',
                  i - 1 < activeStep ? 'font-medium' : 'font-normal',
                )}
              >
                {step.title}
              </span>
            </div>
          ))}
        </div>
      </DialogTitle>
      <div
        className="flex max-h-[30rem] flex-col items-start gap-3 pt-3 pb-4 sm:px-1 md:max-h-[50rem]"
        ref={modalRef}
      >
        <Form {...form}>
          <form
            style={{ width: '100%' }}
            onSubmit={form.handleSubmit(
              (data) => {
                if (activeStep === steps.length - 1) {
                  if (!validateAcknowledgement()) {
                    return;
                  }
                  submitApplication(data);
                }
              },
              () => {
                if (
                  activeStep === steps.length - 1 &&
                  !validateAcknowledgement()
                ) {
                }
              },
            )}
          >
            {activeStep === 0 && (
              <div className="mb-5 flex flex-col gap-4">
                <FormFieldWrapper
                  control={form.control}
                  name="projectTitle"
                  label={
                    isST
                      ? ST_GRANT_COPY.application.projectTitle.label
                      : 'Project Title'
                  }
                  description={
                    isST
                      ? ST_GRANT_COPY.application.projectTitle.description
                      : 'What should we call your project?'
                  }
                  isRequired
                  isPro={isProGrant}
                >
                  <Input
                    placeholder={
                      isST
                        ? ST_GRANT_COPY.application.projectTitle.placeholder
                        : 'Project Title'
                    }
                  />
                </FormFieldWrapper>

                <FormFieldWrapper
                  control={form.control}
                  name="projectOneLiner"
                  label={
                    isST
                      ? ST_GRANT_COPY.application.projectOneLiner.label
                      : 'One-Liner Description'
                  }
                  description={
                    isST
                      ? ST_GRANT_COPY.application.projectOneLiner.description
                      : 'Describe your idea in one sentence.'
                  }
                  isRequired
                  isPro={isProGrant}
                >
                  <Input
                    placeholder={
                      isST
                        ? ST_GRANT_COPY.application.projectOneLiner.placeholder
                        : 'Sum up your project in one sentence'
                    }
                  />
                </FormFieldWrapper>

                <FormFieldWrapper
                  control={form.control}
                  name="ask"
                  label={
                    isST
                      ? ST_GRANT_COPY.application.ask.label
                      : "What's the compensation you require to complete this fully?"
                  }
                  description={
                    isST ? ST_GRANT_COPY.application.ask.description : undefined
                  }
                  isRequired
                  isTokenInput
                  token={token}
                  isPro={isProGrant}
                />

                {!grantApplication && (
                  <SocialInput
                    name="telegram"
                    socialName={'telegram'}
                    placeholder=""
                    required
                    formLabel={
                      isST
                        ? ST_GRANT_COPY.application.telegram.label
                        : 'Your Telegram username'
                    }
                    formDescription={
                      isST
                        ? ST_GRANT_COPY.application.telegram.description
                        : undefined
                    }
                    control={form.control}
                    height="h-9"
                    showIcon={false}
                    isPro={isProGrant}
                  />
                )}
                <FormField
                  control={form.control}
                  name={'walletAddress'}
                  render={({ field }) => (
                    <FormItem className={cn('flex flex-col gap-2')}>
                      <div>
                        <FormLabel isRequired>
                          {isST
                            ? ST_GRANT_COPY.application.walletAddress.label
                            : 'Your Solana Wallet Address'}
                        </FormLabel>
                        <FormDescription>
                          {isST ? (
                            ST_GRANT_COPY.application.walletAddress.description
                          ) : isSuperteamSponsor ? (
                            <>
                              This is where you will receive your rewards if you
                              win.{' '}
                              <span className="font-semibold">
                                Make sure this address can accept {tokenLabel}.
                              </span>
                            </>
                          ) : (
                            'This is where you will receive your rewards if you win.'
                          )}
                        </FormDescription>
                      </div>
                      <div>
                        <FormControl>
                          <Input
                            placeholder="Add your Solana wallet address"
                            className={cn(
                              isProGrant && 'focus-visible:ring-zinc-400',
                            )}
                            {...field}
                          />
                        </FormControl>
                        {!isSameAsEmbeddedWallet && (
                          <p className="pt-0.5 text-xs text-slate-500">
                            <span
                              className="cursor-pointer underline"
                              onClick={handleAutoFill}
                            >
                              Click here
                            </span>{' '}
                            to auto-fill this field with your Earn embedded
                            wallet address
                          </p>
                        )}
                        <FormMessage className="pt-1" />
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            )}
            {activeStep === 1 && (
              <div className="mb-5 flex flex-col gap-4">
                <FormFieldWrapper
                  control={form.control}
                  name="projectDetails"
                  label={
                    isST
                      ? ST_GRANT_COPY.application.projectDetails.label
                      : 'Project Details'
                  }
                  description={
                    isST
                      ? ST_GRANT_COPY.application.projectDetails.description
                      : "What is the problem you're trying to solve, and how you're going to solve it?"
                  }
                  isRequired
                  isRichEditor
                  richEditorPlaceholder={
                    isST
                      ? ST_GRANT_COPY.application.projectDetails.placeholder
                      : 'Describe the problem & solution'
                  }
                  isPro={isProGrant}
                />

                {isST && (
                  <FormField
                    control={form.control}
                    name="lumaLink"
                    render={({ field }) => (
                      <FormItem className={cn('flex flex-col gap-2')}>
                        <div>
                          <FormLabel isRequired>
                            {ST_GRANT_COPY.application.lumaLink.label}
                          </FormLabel>
                          <FormDescription>
                            {ST_GRANT_COPY.application.lumaLink.description}
                          </FormDescription>
                        </div>
                        <div>
                          <FormControl>
                            <div className="flex h-10.75 items-center">
                              <div className="flex h-full items-center justify-center rounded-l-md border border-r-0 border-slate-300 bg-slate-50 px-3 text-xs font-medium text-slate-600 shadow-xs md:justify-start md:text-sm">
                                {LUMA_LABEL}
                              </div>
                              <Input
                                className={cn(
                                  'h-full rounded-l-none',
                                  isProGrant && 'focus-visible:ring-zinc-400',
                                )}
                                placeholder={
                                  ST_GRANT_COPY.application.lumaLink.placeholder
                                }
                                value={getLumaDisplayValue(field.value || '')}
                                onChange={(e) => {
                                  const value = e.currentTarget.value;
                                  const slug = extractLumaEventSlug(value);
                                  field.onChange(slug || value);
                                }}
                              />
                            </div>
                          </FormControl>
                          <FormMessage className="pt-1" />
                        </div>
                      </FormItem>
                    )}
                  />
                )}

                {!isST && (
                  <FormField
                    control={form.control}
                    name="projectTimeline"
                    render={({ field }) => (
                      <FormItem className="flex flex-col gap-2">
                        <div>
                          <FormLabel isRequired>
                            {`Deadline (in ${Intl.DateTimeFormat().resolvedOptions().timeZone})`}
                          </FormLabel>
                          <FormDescription>
                            What is the expected completion date for the
                            project?
                          </FormDescription>
                        </div>
                        <div>
                          <FormControl>
                            <DateTimePicker
                              value={
                                field.value
                                  ? dayjs(field.value, 'YYYY-MM-DD').toDate()
                                  : undefined
                              }
                              onChange={(selectedDate) => {
                                if (selectedDate) {
                                  field.onChange(
                                    dayjs(selectedDate).format('YYYY-MM-DD'),
                                  );
                                } else {
                                  field.onChange(undefined);
                                }
                              }}
                              min={dayjs(date, 'YYYY-MM-DD').toDate()}
                              hideTime={true}
                              minDateTooltipContent="Deadline cannot be in the past"
                              defaultDisplayValue="Pick a date"
                              isPro={isProGrant}
                            />
                          </FormControl>
                          <FormMessage className="pt-1" />
                        </div>
                      </FormItem>
                    )}
                  />
                )}

                <FormFieldWrapper
                  control={form.control}
                  name="proofOfWork"
                  label={
                    isST
                      ? ST_GRANT_COPY.application.proofOfWork.label
                      : 'Proof of Work'
                  }
                  description={
                    isST
                      ? ST_GRANT_COPY.application.proofOfWork.description
                      : 'Include links to your best work that will make the community trust you to execute on this project.'
                  }
                  isRequired={!isST}
                  isRichEditor
                  richEditorPlaceholder={
                    isST
                      ? ST_GRANT_COPY.application.proofOfWork.placeholder
                      : 'Provide links to your portfolio or previous work'
                  }
                  isPro={isProGrant}
                />

                <SocialInput
                  name="twitter"
                  socialName={'twitter'}
                  placeholder="@StarkIndustries"
                  required
                  formLabel={
                    isST
                      ? ST_GRANT_COPY.application.twitter.label
                      : 'Personal X Profile'
                  }
                  formDescription={
                    isST
                      ? ST_GRANT_COPY.application.twitter.description
                      : undefined
                  }
                  control={form.control}
                  height="h-9"
                  showVerification
                  needsVerification={needsXVerification}
                  isVerified={isXVerified}
                  onVerify={handleVerifyClick}
                  isPro={isProGrant}
                />

                {!isST && (
                  <SocialInput
                    name="github"
                    socialName={'github'}
                    placeholder="TonyStark"
                    formLabel="Personal Github Profile"
                    formDescription="If this is a dev-based grant, please add your best github profile here."
                    control={form.control}
                    height="h-9"
                    isPro={isProGrant}
                  />
                )}

                {isST && (
                  <FormFieldWrapper
                    control={form.control}
                    name="expenseBreakdown"
                    label={ST_GRANT_COPY.application.expenseBreakdown.label}
                    description={
                      ST_GRANT_COPY.application.expenseBreakdown.description
                    }
                    isRequired
                    isRichEditor
                    richEditorPlaceholder={
                      ST_GRANT_COPY.application.expenseBreakdown.placeholder
                    }
                    isPro={isProGrant}
                  />
                )}

                {questions?.map((question: any, index: number) => (
                  <FormFieldWrapper
                    key={question.order}
                    control={form.control}
                    name={`answers.${index}.answer`}
                    label={question.question}
                    isRequired
                    isRichEditor
                    isPro={isProGrant}
                  />
                ))}
              </div>
            )}
            {activeStep === 2 && (
              <div className="mb-5 flex flex-col gap-5">
                <FormFieldWrapper
                  control={form.control}
                  name="milestones"
                  label={
                    isST
                      ? ST_GRANT_COPY.application.milestones.label
                      : 'Goals and Milestones'
                  }
                  description={
                    isST
                      ? ST_GRANT_COPY.application.milestones.description
                      : 'List down the things you hope to achieve by the end of project duration.'
                  }
                  isRequired
                  isRichEditor
                  richEditorPlaceholder={
                    isST
                      ? ST_GRANT_COPY.application.milestones.placeholder
                      : 'Outline your project goals and milestones'
                  }
                  isPro={isProGrant}
                />

                {!isST && (
                  <FormFieldWrapper
                    control={form.control}
                    name="kpi"
                    label="Primary Key Performance Indicator"
                    description="What metric will you track to indicate success/failure of the project? At what point will it be a success? Could be anything, e.g. installs, users, views, TVL, etc."
                    isRequired
                    isRichEditor
                    richEditorPlaceholder="What's the key metric for success"
                    isPro={isProGrant}
                  />
                )}

                {!grantApplication && (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="acknowledgement"
                        className={cn(
                          'mt-1',
                          isProGrant
                            ? 'border-zinc-400 data-[state=checked]:border-zinc-800 data-[state=checked]:bg-zinc-800'
                            : 'data-[state=checked]:border-brand-purple data-[state=checked]:bg-brand-purple',
                        )}
                        checked={acknowledgementAccepted}
                        onCheckedChange={(checked) => {
                          setAcknowledgementAccepted(checked as boolean);
                          if (checked) {
                            setAcknowledgementError('');
                          }
                        }}
                      />
                      <label
                        htmlFor="acknowledgement"
                        className="text-xs text-slate-500"
                      >
                        {isST
                          ? ST_GRANT_COPY.application.acknowledgement
                          : 'To receive grant funding, you may need to send proofs of milestone completion and of outcomes that reflect your application and this grant listing.'}
                        <span className="text-red-500">*</span>
                      </label>
                    </div>
                    {acknowledgementError && (
                      <FormMessage>{acknowledgementError}</FormMessage>
                    )}
                  </div>
                )}
              </div>
            )}
            <div className="mt-8 flex gap-2">
              {activeStep > 0 && (
                <Button
                  className="ph-no-capture w-full text-slate-500"
                  onClick={handleBack}
                  variant="ghost"
                  type="button"
                >
                  Back
                </Button>
              )}
              {activeStep === steps.length - 1 ? (
                <Button
                  className={cn(
                    'ph-no-capture w-full',
                    isNotEligibleForPro
                      ? 'bg-zinc-300 text-zinc-700 disabled:opacity-100'
                      : isProGrant && 'bg-zinc-800 hover:bg-black',
                  )}
                  disabled={isLoading || (isPro && !isUserPro)}
                  type="submit"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>Applying...</span>
                    </>
                  ) : isNotEligibleForPro ? (
                    <span className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      <span>Not Eligible</span>
                    </span>
                  ) : grantApplication ? (
                    <span>Update</span>
                  ) : (
                    'Apply'
                  )}
                </Button>
              ) : (
                <Button
                  className={cn(
                    'ph-no-capture w-full',
                    isProGrant && 'bg-zinc-800 hover:bg-black',
                  )}
                  onClick={handleNext}
                  type="button"
                >
                  Continue
                </Button>
              )}
            </div>
          </form>
        </Form>
        <p className="-mt-1 w-full pb-6 text-center text-xs text-slate-400 sm:mt-1 sm:text-sm lg:mt-3">
          By applying for this grant, you agree to our{' '}
          <button
            onClick={() => setIsTOSModalOpen(true)}
            className="cursor-pointer underline underline-offset-2"
            rel="noopener noreferrer"
            type="button"
          >
            Terms of Use
          </button>
          .
        </p>
      </div>
      {grant?.sponsor?.name && (
        <SubmissionTerms
          entityName={grant.sponsor.entityName}
          isOpen={isTOSModalOpen}
          onClose={() => setIsTOSModalOpen(false)}
          sponsorName={grant.sponsor.name}
        />
      )}
      <XVerificationModal
        isOpen={verificationModal.isOpen}
        onClose={() => {
          setVerificationHandle(null);
          verificationModal.onClose();
        }}
        status={verificationStatus}
        handle={verificationHandle}
      />
    </div>
  );
};
