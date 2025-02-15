import { zodResolver } from '@hookform/resolvers/zod';
import { type GrantApplication } from '@prisma/client';
import { useQueryClient } from '@tanstack/react-query';
import { Check, Loader2, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { type z } from 'zod';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
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
import { api } from '@/lib/api';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';
import { dayjs } from '@/utils/dayjs';

import { SubmissionTerms } from '@/features/listings/components/Submission/SubmissionTerms';
import { SocialInput } from '@/features/social/components/SocialInput';
import { extractSocialUsername } from '@/features/social/utils/extractUsername';

import { userApplicationQuery } from '../queries/user-application';
import { type Grant } from '../types';
import { grantApplicationSchema } from '../utils/grantApplicationSchema';

const steps = [
  { title: 'Basics' },
  { title: 'Details' },
  { title: 'Milestones' },
];

type FormData = z.infer<ReturnType<typeof grantApplicationSchema>>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  grant: Grant;
  grantApplication?: GrantApplication;
}

export const GrantApplicationModal = ({
  isOpen,
  onClose,
  grant,
  grantApplication,
}: Props) => {
  const { id, token, minReward, maxReward, questions } = grant;

  const { user, refetchUser } = useUser();

  const [activeStep, setActiveStep] = useState(0);
  const [isTOSModalOpen, setIsTOSModalOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const form = useForm<FormData>({
    resolver: zodResolver(
      grantApplicationSchema(
        minReward || 0,
        maxReward || 0,
        token || 'USDC',
        grant.questions,
        user!,
      ),
    ),
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
    },
  });

  const queryClient = useQueryClient();

  const modalRef = useRef<HTMLDivElement>(null);

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
        answers,
        telegram,
      } = data;

      const apiAction = !!grantApplication ? 'update' : 'create';
      console.log('telegram - ', user?.telegram);

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
        answers: answers || [],
        telegram: telegram || user?.telegram || '',
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
      (keyof FormData | `answers.${number}.answer`)[]
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
        'projectTimeline',
        'proofOfWork',
        'twitter',
        ...(questions?.map(
          (_: any, index: number) => `answers.${index}.answer` as const,
        ) || []),
      ],
      2: ['milestones', 'kpi'],
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

  const isST = grant.sponsor?.name?.toLowerCase().match(/superteam|solana/);

  const date = dayjs().format('YYYY-MM-DD');

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent hideCloseIcon className="max-w-xl" ref={modalRef}>
        <X
          className="absolute right-4 top-7 z-10 h-4 w-4 cursor-pointer text-slate-400 sm:top-6"
          onClick={onClose}
        />
        <DialogTitle className="text-lg tracking-normal text-slate-700 sm:text-xl">
          Grant Application
          <p className="mt-1 text-sm font-normal text-slate-500">
            If you&apos;re working on a project that will help the
            sponsor&apos;s ecosystem grow, apply with your proposal here and
            we&apos;ll respond soon!
          </p>
          <Progress
            className="mt-6 h-[2px] bg-slate-200"
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
                    i < activeStep ? 'bg-brand-purple' : 'bg-transparent',
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
          className="flex max-h-[30rem] flex-col items-start gap-3 pb-4 pt-3 sm:px-1 md:max-h-[50rem]"
          ref={modalRef}
        >
          <Form {...form}>
            <form
              style={{ width: '100%' }}
              onSubmit={form.handleSubmit((data) => {
                if (activeStep === steps.length - 1) {
                  submitApplication(data);
                }
              })}
            >
              {activeStep === 0 && (
                <div className="mb-5 flex flex-col gap-4">
                  <FormFieldWrapper
                    control={form.control}
                    name="projectTitle"
                    label="Project Title"
                    description="What should we call your project?"
                    isRequired
                  >
                    <Input placeholder="Project Title" />
                  </FormFieldWrapper>

                  <FormFieldWrapper
                    control={form.control}
                    name="projectOneLiner"
                    label="One-Liner Description"
                    description="Describe your idea in one sentence."
                    isRequired
                  >
                    <Input placeholder="Sum up your project in one sentence" />
                  </FormFieldWrapper>

                  <FormFieldWrapper
                    control={form.control}
                    name="ask"
                    label="What's the compensation you require to complete this fully?"
                    isRequired
                    isTokenInput
                    token={token}
                  />

                  {!grantApplication && (
                    <SocialInput
                      name="telegram"
                      socialName={'telegram'}
                      placeholder=""
                      required
                      formLabel="Your Telegram username"
                      control={form.control}
                      height="h-9"
                    />
                  )}
                  <FormField
                    control={form.control}
                    name={'walletAddress'}
                    render={({ field }) => (
                      <FormItem className={cn('flex flex-col gap-2')}>
                        <div>
                          <FormLabel isRequired>
                            Your Solana Wallet Address
                          </FormLabel>
                          <FormDescription>
                            {isST
                              ? 'This is where you will receive your rewards if you win. Make sure this address can accept both USDT & USDC.'
                              : 'This is where you will receive your rewards if you win.'}
                          </FormDescription>
                        </div>
                        <div>
                          <FormControl>
                            <Input
                              placeholder="Add your Solana wallet address"
                              {...field}
                            />
                          </FormControl>
                          <p className="pt-0.5 text-xs text-slate-500">
                            <span
                              className="cursor-pointer underline"
                              onClick={handleAutoFill}
                            >
                              Click
                            </span>{' '}
                            to auto-fill your Earn wallet address (can accept
                            any Solana token).
                          </p>
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
                    label="Project Details"
                    description="What is the problem you're trying to solve, and how you're going to solve it?"
                    isRequired
                    isRichEditor
                    richEditorPlaceholder="Describe the problem & solution"
                  />

                  <FormFieldWrapper
                    control={form.control}
                    name="projectTimeline"
                    label={`Deadline (in ${Intl.DateTimeFormat().resolvedOptions().timeZone})`}
                    description="What is the expected completion date for the project?"
                    isRequired
                  >
                    <Input
                      className={cn(
                        'relative w-full',
                        '[&::-webkit-calendar-picker-indicator]:opacity-0',
                        '[&::-webkit-calendar-picker-indicator]:absolute',
                        '[&::-webkit-calendar-picker-indicator]:inset-0',
                        '[&::-webkit-calendar-picker-indicator]:w-full',
                        '[&::-webkit-calendar-picker-indicator]:h-full',
                        '[&::-webkit-calendar-picker-indicator]:cursor-pointer',
                      )}
                      min={date}
                      placeholder="deadline"
                      type="date"
                    />
                  </FormFieldWrapper>

                  <FormFieldWrapper
                    control={form.control}
                    name="proofOfWork"
                    label="Proof of Work"
                    description="Include links to your best work that will make the community trust you to execute on this project."
                    isRequired
                    isRichEditor
                    richEditorPlaceholder="Provide links to your portfolio or previous work"
                  />

                  <SocialInput
                    name="twitter"
                    socialName={'twitter'}
                    placeholder="@StarkIndustries"
                    required
                    formLabel="Personal Twitter Profile"
                    formDescription="Include links to your best work that will make the community trust you to execute on this project."
                    control={form.control}
                    height="h-9"
                  />

                  {questions?.map((question: any, index: number) => (
                    <FormFieldWrapper
                      key={question.order}
                      control={form.control}
                      name={`answers.${index}.answer`}
                      label={question.question}
                      isRequired
                      isRichEditor
                    />
                  ))}
                </div>
              )}
              {activeStep === 2 && (
                <div className="mb-5 flex flex-col gap-5">
                  <FormFieldWrapper
                    control={form.control}
                    name="milestones"
                    label="Goals and Milestones"
                    description="List down the things you hope to achieve by the end of project duration."
                    isRequired
                    isRichEditor
                    richEditorPlaceholder="Outline your project goals and milestones"
                  />

                  <FormFieldWrapper
                    control={form.control}
                    name="kpi"
                    label="Primary Key Performance Indicator"
                    description="What metric will you track to indicate success/failure of the project? At what point will it be a success? Could be anything, e.g. installs, users, views, TVL, etc."
                    isRequired
                    isRichEditor
                    richEditorPlaceholder="What's the key metric for success"
                  />
                </div>
              )}
              <div className="mt-8 flex gap-2">
                {activeStep > 0 && (
                  <Button
                    className="ph-no-capture w-full text-slate-500"
                    onClick={handleBack}
                    variant="ghost"
                  >
                    Back
                  </Button>
                )}
                {activeStep === steps.length - 1 ? (
                  <Button
                    className="ph-no-capture w-full"
                    disabled={isLoading}
                    type="submit"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Applying...
                      </>
                    ) : grantApplication ? (
                      'Update'
                    ) : (
                      'Apply'
                    )}
                  </Button>
                ) : (
                  <Button
                    className="ph-no-capture w-full"
                    onClick={handleNext}
                    type="button"
                  >
                    Continue
                  </Button>
                )}
              </div>
            </form>
          </Form>
          <p className="-mt-1 w-full pb-6 text-center text-xs text-slate-400 sm:mt-1 sm:pb-0 sm:text-sm lg:mt-3">
            By applying for this grant, you agree to our{' '}
            <button
              onClick={() => setIsTOSModalOpen(true)}
              className="cursor-pointer underline underline-offset-2"
              rel="noopener noreferrer"
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
      </DialogContent>
    </Dialog>
  );
};
