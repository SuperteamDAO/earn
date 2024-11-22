import { CheckIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  Icon,
  Image,
  Input,
  InputGroup,
  InputLeftAddon,
  Link,
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
import { type GrantApplication } from '@prisma/client';
import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { FaXTwitter } from 'react-icons/fa6';

import RichTextInputWithHelper from '@/components/Form/RichTextInput';
import {
  TextAreaWithCounter,
  TextInputWithHelper,
} from '@/components/Form/TextAreaHelpers';
import { tokenList } from '@/constants';
import {
  extractTwitterUsername,
  isValidTwitterInput,
  isValidTwitterUsername,
} from '@/features/talent';
import { useUpdateUser, useUser } from '@/store/user';
import { dayjs } from '@/utils/dayjs';

import { userApplicationQuery } from '../queries';
import { type Grant } from '../types';

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
  const [error, setError] = useState('');
  const [askError, setAskError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    control,
    setValue,
  } = useForm<GrantApplicationForm>({
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
    if (user?.publicKey) setValue('publicKey', user?.publicKey);
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
        answers: grantAnswers.length ? grantAnswers : null,
      });

      reset();
      await queryClient.invalidateQueries({
        queryKey: userApplicationQuery(id).queryKey,
      });

      await refetchUser();

      onClose();
    } catch (e) {
      setError('Sorry! Please try again or contact support.');
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    if (activeStep === 0) {
      const askValue = watch('ask') || 0;
      const min = minReward || 0;
      const max = maxReward || Infinity;

      if (askValue < min || askValue > max) {
        setAskError(
          `Compensation must be between ${min.toLocaleString()} and ${max.toLocaleString()} ${token}`,
        );
        return;
      }
    }
    setAskError('');
    setActiveStep((prev) => prev + 1);
    if (modalRef.current) {
      modalRef.current.scrollTop = 0;
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
    if (modalRef.current) {
      modalRef.current.scrollTop = 0;
    }
  };

  const date = dayjs().format('YYYY-MM-DD');

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
          <Box></Box>
          <form
            style={{ width: '100%' }}
            onSubmit={handleSubmit((e) => {
              if (activeStep === steps.length - 1) {
                submitApplication(e);
              } else {
                handleNext();
              }
            })}
          >
            {activeStep === 0 && (
              <VStack gap={4} mb={5}>
                <TextAreaWithCounter
                  id="projectTitle"
                  label="Project Title"
                  helperText="What should we call your project?"
                  placeholder=""
                  register={register}
                  watch={watch}
                  errors={errors}
                  isRequired
                  maxLength={100}
                />
                <TextAreaWithCounter
                  id="projectOneLiner"
                  label="One-Liner Description"
                  helperText="Describe your idea in one sentence."
                  maxLength={150}
                  placeholder=""
                  register={register}
                  watch={watch}
                  errors={errors}
                  isRequired
                />
                <FormControl isRequired>
                  <FormLabel
                    mb={0}
                    color={'brand.slate.600'}
                    fontWeight={600}
                    htmlFor={'ask'}
                  >
                    Grant Amount
                  </FormLabel>
                  <FormHelperText mt={0} mb={2} color="brand.slate.500">
                    How much funding do you require to complete this project?
                  </FormHelperText>
                  <InputGroup>
                    <InputLeftAddon>
                      <Image
                        w={4}
                        h={4}
                        alt={'green doller'}
                        rounded={'full'}
                        src={
                          tokenList.filter((e) => e?.tokenSymbol === token)[0]
                            ?.icon ?? '/assets/icons/green-dollar.svg'
                        }
                      />
                      <Text ml={2} color="brand.slate.500" fontWeight={500}>
                        {token}
                      </Text>
                    </InputLeftAddon>
                    <Input
                      borderColor={'brand.slate.300'}
                      _placeholder={{ color: 'brand.slate.300' }}
                      focusBorderColor="brand.purple"
                      id="ask"
                      onWheel={(e) => (e.target as HTMLElement).blur()}
                      placeholder=""
                      {...register('ask')}
                      type="number"
                    />
                  </InputGroup>
                  <Text mt={1} ml={1} color="red" fontSize="14px">
                    {askError}
                  </Text>
                </FormControl>
                <TextInputWithHelper
                  id="publicKey"
                  label="Your Solana Wallet Address"
                  helperText={
                    <>
                      This is where you will receive your rewards if you win. If
                      you want to edit it,{' '}
                      <Text as="u">
                        <Link
                          color="blue.600"
                          href={`/t/${user?.username}/edit`}
                          isExternal
                        >
                          click here
                        </Link>
                      </Text>{' '}
                    </>
                  }
                  placeholder=""
                  register={register}
                  errors={errors}
                  defaultValue={user?.publicKey}
                  readOnly
                />
              </VStack>
            )}
            {activeStep === 1 && (
              <VStack gap={4} mb={5}>
                <RichTextInputWithHelper
                  id="projectDetails"
                  label="Project Details"
                  helperText="What is the problem you're trying to solve, and how you're going to solve it?"
                  placeholder=""
                  control={control}
                  isRequired
                />
                <FormControl isRequired>
                  <FormLabel
                    mb={0}
                    color={'brand.slate.600'}
                    fontWeight={600}
                    htmlFor={id}
                  >
                    Deadline (in{' '}
                    {Intl.DateTimeFormat().resolvedOptions().timeZone})
                  </FormLabel>
                  <FormHelperText mt={0} mb={2} color="brand.slate.500">
                    What is the expected completion date for the project?
                  </FormHelperText>
                  <Input
                    w={'full'}
                    color={'brand.slate.500'}
                    borderColor="brand.slate.300"
                    _placeholder={{
                      color: 'brand.slate.300',
                    }}
                    css={{
                      boxSizing: 'border-box',
                      padding: '.75rem',
                      position: 'relative',
                      width: '100%',
                      '&::-webkit-calendar-picker-indicator': {
                        background: 'transparent',
                        bottom: 0,
                        color: 'transparent',
                        cursor: 'pointer',
                        height: 'auto',
                        left: 0,
                        position: 'absolute',
                        right: 0,
                        top: 0,
                        width: 'auto',
                      },
                    }}
                    focusBorderColor="brand.purple"
                    id="projectTimeline"
                    min={date}
                    placeholder=""
                    type={'date'}
                    {...register('projectTimeline', { required: true })}
                  />
                </FormControl>

                <RichTextInputWithHelper
                  id="proofOfWork"
                  label="Proof of Work"
                  helperText="Include links to your best work that will make the community trust you to execute on this project."
                  placeholder=""
                  control={control}
                  isRequired
                />

                <FormControl isRequired>
                  <FormLabel
                    mb={0}
                    color={'brand.slate.600'}
                    fontWeight={600}
                    htmlFor={id}
                  >
                    Personal Twitter Profile
                  </FormLabel>
                  <FormHelperText mt={0} mb={2} color="brand.slate.500">
                    Add your personal Twitter username
                  </FormHelperText>
                  <Box mb={'1.25rem'}>
                    <Flex align="center" justify="center" direction="row">
                      <Box pos="relative">
                        <Icon
                          as={FaXTwitter}
                          boxSize={5}
                          mr={3}
                          color={'brand.slate.600'}
                        />
                      </Box>
                      <Box
                        h="2.6875rem"
                        px={3}
                        border="1px solid"
                        borderColor={'brand.slate.300'}
                        borderRight="none"
                        borderLeftRadius={'md'}
                      >
                        <Flex
                          align="center"
                          justify={{ base: 'center', md: 'start' }}
                          w={'100%'}
                          h={'100%'}
                        >
                          <Text
                            h="4.3rem"
                            color={'brand.slate.600'}
                            fontSize={{ base: '0.7rem', md: '0.875rem' }}
                            fontWeight={500}
                            lineHeight="4.3rem"
                            textAlign="left"
                          >
                            x.com/
                          </Text>
                        </Flex>
                      </Box>
                      <Input
                        w="full"
                        h="2.6875rem"
                        color={'gray.800'}
                        fontSize="0.875rem"
                        fontWeight={500}
                        borderColor={'brand.slate.300'}
                        borderLeftRadius={0}
                        _placeholder={{
                          color: 'brand.slate.300',
                        }}
                        defaultValue={
                          extractTwitterUsername(user?.twitter || '') ||
                          undefined
                        }
                        focusBorderColor="brand.purple"
                        id="twitter"
                        placeholder=""
                        {...register('twitter', {
                          validate: (value) => {
                            if (
                              !isValidTwitterInput(value || '') &&
                              !isValidTwitterUsername(value || '')
                            ) {
                              return false;
                            }
                            return true;
                          },
                        })}
                      />
                    </Flex>
                  </Box>
                </FormControl>

                {questions &&
                  questions.map((e: any) => (
                    <RichTextInputWithHelper
                      key={e?.order}
                      id={`answer-${e?.order}`}
                      label={e?.question}
                      control={control}
                      isRequired
                    />
                  ))}
              </VStack>
            )}
            {activeStep === 2 && (
              <VStack gap={4} mb={5}>
                <RichTextInputWithHelper
                  id="milestones"
                  label="Goals and Milestones"
                  helperText="List down the things you hope to achieve by the end of project duration."
                  placeholder=""
                  control={control}
                  isRequired
                  h="8rem"
                />
                <RichTextInputWithHelper
                  id="kpi"
                  label="Primary Key Performance Indicator"
                  helperText="What metric will you track to indicate success/failure of the project? At what point will it be a success? Could be anything, e.g. installs, users, views, TVL, etc."
                  placeholder=""
                  control={control}
                  isRequired
                  h="8rem"
                />
              </VStack>
            )}
            {!!error && (
              <Text align="center" mb={2} color="red">
                Sorry! An error occurred while submitting. <br />
                Please try again or contact us at hello@superteamearn.com
              </Text>
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
              <Button
                className="ph-no-capture"
                w={'full'}
                isLoading={!!isLoading}
                loadingText="Applying..."
                type="submit"
                variant="solid"
              >
                {activeStep === steps.length - 1
                  ? !!grantApplication
                    ? 'Update'
                    : 'Apply'
                  : 'Continue'}
              </Button>
            </Flex>
          </form>
        </VStack>
      </ModalContent>
    </Modal>
  );
};
