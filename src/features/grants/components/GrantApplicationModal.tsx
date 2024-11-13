import { CheckIcon } from '@chakra-ui/icons';
import {
  Button,
  Flex,
  Image,
  Modal,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Progress,
  Stepper,
  Text,
  useSteps,
  VStack,
} from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { type GrantApplication } from '@prisma/client';
import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { RichEditor } from '@/components/shared/RichEditor';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { tokenList } from '@/constants';
import { extractTwitterUsername, Twitter } from '@/features/talent';
import { useUpdateUser, useUser } from '@/store/user';
import { cn } from '@/utils';
import { dayjs } from '@/utils/dayjs';

import { userApplicationQuery } from '../queries';
import { type Grant } from '../types';
import { grantApplicationSchema } from '../utils/grantApplicationSchema';

const steps = [
  { title: 'Basics' },
  { title: 'Details' },
  { title: 'Milestones' },
];

interface EligibilityAnswer {
  question: string;
  answer: string;
}

interface GrantApplicationForm {
  projectTitle: string;
  projectOneLiner: string;
  ask: number;
  walletAddress: string;
  projectDetails: string;
  projectTimeline: string;
  proofOfWork: string;
  milestones: string;
  kpi: string;
  twitter: string;
  [key: string]: string | number;
}

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

  const updateUser = useUpdateUser();

  const { activeStep, setActiveStep } = useSteps({
    index: 0,
    count: steps.length,
  });

  const [isLoading, setIsLoading] = useState(false);
  const form = useForm<GrantApplicationForm>({
    resolver: zodResolver(
      grantApplicationSchema(
        minReward || 0,
        maxReward || 0,
        token || 'USDC',
        grant.questions,
      ),
    ),
    defaultValues: {
      projectTitle: grantApplication?.projectTitle || '',
      projectOneLiner: grantApplication?.projectOneLiner || '',
      ask: grantApplication?.ask || undefined,
      walletAddress: grantApplication?.walletAddress || user?.publicKey || '',
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
        ? extractTwitterUsername(grantApplication?.twitter) || ''
        : extractTwitterUsername(user?.twitter || '') || '',
      ...(grantApplication?.answers
        ? Object.fromEntries(
            (grantApplication.answers as unknown as EligibilityAnswer[]).map(
              (answer, index) => [`answer-${index + 1}`, answer.answer],
            ),
          )
        : {}),
    },
  });

  const queryClient = useQueryClient();

  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user?.publicKey) form.setValue('publicKey', user?.publicKey);
  }, [user]);

  const submitApplication = async (data: any) => {
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
        ...answers
      } = data;

      await updateUser.mutateAsync({ publicKey: walletAddress });

      const grantAnswers =
        questions?.map((q: any) => ({
          question: q.question,
          answer: answers[`answer-${q.order}`],
        })) ?? [];

      const apiAction = !!grantApplication ? 'update' : 'create';

      await axios.post(`/api/grant-application/${apiAction}/`, {
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
        answers: grantAnswers.length ? grantAnswers : [],
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
    const fieldsToValidate = {
      0: ['projectTitle', 'projectOneLiner', 'walletAddress'],
      1: [
        'projectDetails',
        'projectTimeline',
        'proofOfWork',
        'twitter',
        ...(questions?.map((q: any) => `answer-${q.order}`) || []),
      ],
      2: ['milestones', 'kpi'],
    };

    form
      .trigger(fieldsToValidate[activeStep as keyof typeof fieldsToValidate])
      .then((isValid) => {
        if (isValid) {
          setActiveStep((prev) => prev + 1);
          if (modalRef.current) {
            modalRef.current.scrollTop = 0;
          }
        }
      });
  };
  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
    if (modalRef.current) {
      modalRef.current.scrollTop = 0;
    }
  };

  const date = dayjs().format('YYYY-MM-DD');

  useEffect(() => {
    console.log(form.formState.errors);
  }, [form.formState.errors]);

  return (
    <Modal
      closeOnOverlayClick={false}
      isCentered
      isOpen={isOpen}
      onClose={onClose}
      scrollBehavior={'inside'}
      size={'xl'}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader px={{ base: 4, md: 10 }} pt={8} color="brand.slate.800">
          Grant Application
          <Text mt={1} color={'brand.slate.500'} fontSize="sm" fontWeight={400}>
            If you&apos;re working on a project that will help the
            sponsor&apos;s ecosystem grow, apply with your proposal here and
            we&apos;ll respond soon!
          </Text>
          <Progress
            h={'1.5px'}
            mx={-3}
            mt={6}
            borderRadius={2}
            bgColor={'brand.slate.200'}
            value={(activeStep / steps.length) * 100 + 33}
          />
          <Stepper w="100%" mt={3} index={activeStep}>
            {steps.map((step, i) => (
              <Flex key={i} align={'center'} gap={1.5} fontWeight={400}>
                <Text
                  align={'center'}
                  verticalAlign={'middle'}
                  w="6"
                  h="6"
                  color={
                    i - 1 < activeStep ? 'brand.slate.500' : 'brand.slate.400'
                  }
                  fontWeight={i - 1 < activeStep ? 500 : 400}
                  borderWidth={'1px'}
                  borderColor={
                    i < activeStep
                      ? 'transparent'
                      : i - 1 < activeStep
                        ? 'brand.slate.500'
                        : 'brand.slate.300'
                  }
                  borderRadius={'full'}
                  bgColor={i < activeStep ? 'brand.purple' : 'transparent'}
                  style={{
                    fontSize: '14px',
                  }}
                >
                  {i < activeStep ? (
                    <CheckIcon color="white" boxSize={2.5} />
                  ) : (
                    i + 1
                  )}
                </Text>
                <Text
                  color={
                    i - 1 < activeStep ? 'brand.slate.600' : 'brand.slate.500'
                  }
                  fontSize={'md'}
                  fontWeight={i - 1 < activeStep ? 500 : 400}
                >
                  {step.title}
                </Text>
              </Flex>
            ))}
          </Stepper>
        </ModalHeader>
        <ModalCloseButton mt={5} />
        <VStack
          ref={modalRef}
          align={'start'}
          gap={3}
          overflowY={'auto'}
          maxH={'50rem'}
          px={{ base: 4, md: 10 }}
          pb={10}
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
                <VStack gap={4} mb={5}>
                  <FormField
                    control={form.control}
                    name="projectTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel isRequired>Project Title</FormLabel>
                        <FormDescription>
                          What should we call your project?
                        </FormDescription>
                        <FormControl>
                          <Input {...field} placeholder="Project Title" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="projectOneLiner"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel isRequired>One-Liner Description</FormLabel>
                        <FormDescription>
                          Describe your idea in one sentence.
                        </FormDescription>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Sum up your project in one sentence"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ask"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel isRequired>
                          What&apos;s the compensation you require to complete
                          this fully?
                        </FormLabel>
                        <FormControl>
                          <div className="flex">
                            <div className="mt-2 flex items-center gap-1 rounded-l-md border border-r-0 border-input bg-muted pl-3 pr-5">
                              <Image
                                className="h-4 w-4 rounded-full"
                                alt="green dollar"
                                src={
                                  tokenList.filter(
                                    (e) => e?.tokenSymbol === token,
                                  )[0]?.icon ?? '/assets/icons/green-dollar.svg'
                                }
                              />
                              <p className="font-medium text-slate-500">
                                {token}
                              </p>
                            </div>
                            <Input
                              className="rounded-l-none"
                              {...field}
                              type="number"
                              value={field.value ?? ''}
                              onChange={(e) => {
                                const value =
                                  e.target.value === ''
                                    ? null
                                    : Number(e.target.value);
                                field.onChange(value);
                              }}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="walletAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Solana Wallet Address</FormLabel>
                        <FormDescription>
                          This is where you will receive your rewards if you
                          win. If you want to edit it,{' '}
                          <a
                            href={`/t/${user?.username}/edit`}
                            className="text-blue-600 underline hover:text-blue-700"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            click here
                          </a>
                        </FormDescription>
                        <FormControl>
                          <Input
                            {...field}
                            className="opacity-50"
                            placeholder="Add your Solana wallet address"
                            readOnly
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </VStack>
              )}
              {activeStep === 1 && (
                <VStack gap={4} mb={5}>
                  <FormField
                    control={form.control}
                    name="projectDetails"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel isRequired>Project Details</FormLabel>
                        <FormDescription>
                          What is the problem you&apos;re trying to solve, and
                          how you&apos;re going to solve it?
                        </FormDescription>
                        <FormControl>
                          <RichEditor
                            id="projectDetails"
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Explain the problem you're solving and your solution"
                            error={false}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="projectTimeline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel isRequired>
                          Deadline (in{' '}
                          {Intl.DateTimeFormat().resolvedOptions().timeZone})
                        </FormLabel>
                        <FormDescription>
                          What is the expected completion date for the project?
                        </FormDescription>
                        <FormControl>
                          <Input
                            className={cn(
                              'border-input focus-visible:ring-brand-purple',
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
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="proofOfWork"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel isRequired>Proof of Work</FormLabel>
                        <FormDescription>
                          Include links to your best work that will make the
                          community trust you to execute on this project.
                        </FormDescription>
                        <FormControl>
                          <RichEditor
                            id="proofOfWork"
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Provide links to your portfolio or previous work"
                            error={false}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="twitter"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel isRequired>
                          Personal Twitter Profile
                        </FormLabel>
                        <FormDescription>
                          Add your personal Twitter username
                        </FormDescription>
                        <FormControl>
                          <div className="mb-5 flex items-center">
                            <div className="relative mt-2 flex items-center">
                              <Twitter className="mr-3 h-5 w-5 text-slate-600" />
                            </div>
                            <div className="mt-2 flex h-9 items-center rounded-l-md border border-r-0 border-input px-3">
                              <span className="text-sm font-medium text-slate-600 md:text-[0.875rem]">
                                x.com/
                              </span>
                            </div>
                            <Input
                              {...field}
                              className={'rounded-l-none'}
                              defaultValue={
                                extractTwitterUsername(user?.twitter || '') ||
                                undefined
                              }
                              placeholder="johncena"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {questions?.map((question: any) => (
                    <FormField
                      key={question.order}
                      control={form.control}
                      name={`answer-${question.order}`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel isRequired>{question.question}</FormLabel>
                          <FormControl>
                            <RichEditor
                              id={`answer-${question.order}`}
                              value={field.value?.toString() || ''}
                              onChange={field.onChange}
                              error={false}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </VStack>
              )}
              {activeStep === 2 && (
                <VStack gap={4} mb={5}>
                  <FormField
                    control={form.control}
                    name="milestones"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel isRequired>Goals and Milestones</FormLabel>
                        <FormDescription>
                          List down the things you hope to achieve by the end of
                          project duration.
                        </FormDescription>
                        <FormControl>
                          <RichEditor
                            id="milestones"
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Outline your project goals and milestones"
                            error={false}
                            height="h-32"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="kpi"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel isRequired>
                          Primary Key Performance Indicator
                        </FormLabel>
                        <FormDescription>
                          What metric will you track to indicate success/failure
                          of the project? At what point will it be a success?
                          Could be anything, e.g. installs, users, views, TVL,
                          etc.
                        </FormDescription>
                        <FormControl>
                          <RichEditor
                            id="kpi"
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="What's the key metric for success?"
                            error={false}
                            height="h-32"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </VStack>
              )}
              <Flex gap={2} mt={8}>
                {activeStep > 0 && (
                  <Button
                    className="ph-no-capture"
                    w={'full'}
                    color="brand.slate.500"
                    onClick={handleBack}
                    variant="unstyled"
                  >
                    Back
                  </Button>
                )}
                {activeStep === steps.length - 1 ? (
                  <Button
                    className="ph-no-capture"
                    w={'full'}
                    isLoading={!!isLoading}
                    loadingText="Applying..."
                    type="submit"
                    variant="solid"
                  >
                    {!!grantApplication ? 'Update' : 'Apply'}
                  </Button>
                ) : (
                  <Button
                    className="ph-no-capture"
                    w={'full'}
                    onClick={handleNext}
                    type="button"
                    variant="solid"
                  >
                    Continue
                  </Button>
                )}
              </Flex>
            </form>
          </Form>
        </VStack>
      </ModalContent>
    </Modal>
  );
};
