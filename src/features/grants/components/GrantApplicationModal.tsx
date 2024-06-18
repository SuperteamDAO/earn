import { CheckIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  Image,
  Input,
  InputGroup,
  InputLeftAddon,
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
import axios from 'axios';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import {
  TextAreaWithCounter,
  TextInputWithHelper,
} from '@/components/Form/TextAreaHelpers';
import { tokenList } from '@/constants';
import { userStore } from '@/store/user';
import { dayjs } from '@/utils/dayjs';
import { validateSolAddress } from '@/utils/validateSolAddress';

import { type Grant } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  setHasApplied: (arg0: boolean) => void;
  grant: Grant;
}

const steps = [
  { title: 'Basics' },
  { title: 'Details' },
  { title: 'Milestones' },
];

export const GrantApplicationModal = ({
  isOpen,
  onClose,
  setHasApplied,
  grant,
}: Props) => {
  const { id, token, minReward, maxReward } = grant;
  const { activeStep, setActiveStep } = useSteps({
    index: 0,
    count: steps.length,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [publicKeyError, setPublicKeyError] = useState('');
  const [askError, setAskError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm();

  const { userInfo, setUserInfo } = userStore();

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
      } = data;
      // const grantAnswers = questions?.map((q: any, index: number) => ({
      //   question: q.question,
      //   answer: answers[`eligibility-${index}`],
      // }));

      await axios.post('/api/user/update/', {
        publicKey: walletAddress,
      });

      await axios.post('/api/grantApplication/create/', {
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
      });

      reset();
      setHasApplied(true);

      const updatedUser = await axios.post('/api/user/');
      setUserInfo(updatedUser?.data);

      onClose();
    } catch (e) {
      setError('Sorry! Please try again or contact support.');
      setIsLoading(false);
    }
  };

  const handleNext = () => setActiveStep((prev) => prev + 1);
  const handleBack = () => setActiveStep((prev) => prev - 1);

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
            sponsor&apos;s ecosystem grow, apply for any of our grants and
            we&apos;ll respond in 48 hours!
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
                  placeholder="Project Title"
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
                  placeholder="Sum up your project in one sentence"
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
                      placeholder="Enter amount"
                      {...register('ask', {
                        valueAsNumber: true,
                        validate: (value) => {
                          if (minReward && maxReward) {
                            if (value < minReward || value > maxReward) {
                              setAskError(
                                `Compensation must be between ${minReward.toLocaleString()} and ${maxReward.toLocaleString()} ${token}`,
                              );
                              return false;
                            }
                          }
                          return true;
                        },
                      })}
                      type="number"
                    />
                  </InputGroup>
                  <Text mt={1} ml={1} color="red" fontSize="14px">
                    {askError}
                  </Text>
                </FormControl>
                <TextInputWithHelper
                  id="walletAddress"
                  label="Your Solana Wallet Address"
                  helperText={
                    'Where should we send the funds? No .sol domains please!'
                  }
                  placeholder="Add your Solana wallet address"
                  register={register}
                  errors={errors}
                  validate={(address: string) =>
                    validateSolAddress(address, setPublicKeyError)
                  }
                  defaultValue={userInfo?.publicKey}
                  isRequired
                />
                {publicKeyError && (
                  <Text mt={1} ml={1} color="red" fontSize="14px">
                    {publicKeyError}
                  </Text>
                )}
              </VStack>
            )}
            {activeStep === 1 && (
              <VStack gap={4} mb={5}>
                <TextAreaWithCounter
                  id="projectDetails"
                  label="Project Details"
                  helperText="What is the problem you're trying to solve, and how you're going to solve it?"
                  placeholder="Explain the problem you're solving and your solution"
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
                    placeholder="deadline"
                    type={'date'}
                    {...register('projectTimeline', { required: true })}
                  />
                </FormControl>

                <TextAreaWithCounter
                  id="proofOfWork"
                  label="Proof of Work"
                  helperText="Include links to your best work that will make the community trust you to execute on this project."
                  placeholder="Provide links to your portfolio or previous work"
                  register={register}
                  watch={watch}
                  errors={errors}
                  isRequired
                />
              </VStack>
            )}
            {activeStep === 2 && (
              <VStack gap={4} mb={5}>
                <TextAreaWithCounter
                  id="milestones"
                  label="Goals and Milestones"
                  helperText="List down the things you hope to achieve by the end of project duration."
                  placeholder="Outline your project goals and milestones"
                  register={register}
                  watch={watch}
                  errors={errors}
                  isRequired
                />
                <TextAreaWithCounter
                  id="kpi"
                  label="Primary Key Performance Indicator"
                  helperText="What metric will you track to indicate success/failure of the project? At what point will it be a success? Could be anything, e.g. installs, users, views, TVL, etc."
                  placeholder="What's the key metric for success?"
                  register={register}
                  watch={watch}
                  errors={errors}
                  isRequired
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
                {activeStep === steps.length - 1 ? 'Apply' : 'Continue'}
              </Button>
            </Flex>
          </form>
        </VStack>
      </ModalContent>
    </Modal>
  );
};
