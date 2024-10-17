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
import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { FaXTwitter } from 'react-icons/fa6';

import {
  TextAreaWithCounter,
  TextInputWithHelper,
} from '@/components/Form/TextAreaHelpers';
import { tokenList } from '@/constants';
import { QuestionHandler } from '@/features/listings';
import {
  extractTwitterUsername,
  isValidTwitterInput,
  isValidTwitterUsername,
} from '@/features/talent';
import { useUpdateUser, useUser } from '@/store/user';
import { dayjs } from '@/utils/dayjs';
import { validateSolAddress } from '@/utils/validateSolAddress';

import { userApplicationStatusQuery } from '../queries';
import { type Grant } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  grant: Grant;
}

const steps = [
  { title: 'Basics' },
  { title: 'Details' },
  { title: 'Milestones' },
];

export const GrantApplicationModal = ({ isOpen, onClose, grant }: Props) => {
  const { id, token, minReward, maxReward, questions } = grant;
  const { t } = useTranslation('common');

  const { user, refetchUser } = useUser();

  const updateUser = useUpdateUser();

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

  const queryClient = useQueryClient();

  const modalRef = useRef<HTMLDivElement>(null);

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

      await axios.post('/api/grant-application/create/', {
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
        queryKey: userApplicationStatusQuery(id).queryKey,
      });

      await refetchUser();

      onClose();
    } catch (e) {
      setError(t('grantApplicationModal.errorMessage'));
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    if (activeStep === 0) {
      const askValue = watch('ask');
      const min = minReward || 0;
      const max = maxReward || Infinity;

      if (askValue < min || askValue > max) {
        setAskError(
          `${t('grantApplicationModal.grantAmount')} ${min.toLocaleString()} ${t('and')} ${max.toLocaleString()} ${token}`,
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
          {t('grantApplicationModal.title')}
          <Text mt={1} color={'brand.slate.500'} fontSize="sm" fontWeight={400}>
            {t('grantApplicationModal.description')}
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
                  {t(`grantApplicationModal.${step.title.toLowerCase()}`)}
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
                  label={t('grantApplicationModal.projectTitle')}
                  helperText={t('grantApplicationModal.projectTitleHelper')}
                  placeholder={t(
                    'grantApplicationModal.projectTitlePlaceholder',
                  )}
                  register={register}
                  watch={watch}
                  errors={errors}
                  isRequired
                  maxLength={100}
                />
                <TextAreaWithCounter
                  id="projectOneLiner"
                  label={t('grantApplicationModal.oneLinerDescription')}
                  helperText={t(
                    'grantApplicationModal.oneLinerDescriptionHelper',
                  )}
                  maxLength={150}
                  placeholder={t(
                    'grantApplicationModal.oneLinerDescriptionPlaceholder',
                  )}
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
                    {t('grantApplicationModal.grantAmount')}
                  </FormLabel>
                  <FormHelperText mt={0} mb={2} color="brand.slate.500">
                    {t('grantApplicationModal.grantAmountHelper')}
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
                      placeholder={t(
                        'grantApplicationModal.grantAmountPlaceholder',
                      )}
                      {...register('ask')}
                      type="number"
                    />
                  </InputGroup>
                  <Text mt={1} ml={1} color="red" fontSize="14px">
                    {askError}
                  </Text>
                </FormControl>
                <TextInputWithHelper
                  id="walletAddress"
                  label={t('grantApplicationModal.walletAddress')}
                  helperText={t('grantApplicationModal.walletAddressHelper')}
                  placeholder={t(
                    'grantApplicationModal.walletAddressPlaceholder',
                  )}
                  register={register}
                  errors={errors}
                  validate={(address: string) =>
                    validateSolAddress(address, setPublicKeyError)
                  }
                  defaultValue={user?.publicKey}
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
                  label={t('grantApplicationModal.projectDetails')}
                  helperText={t('grantApplicationModal.projectDetailsHelper')}
                  placeholder={t(
                    'grantApplicationModal.projectDetailsPlaceholder',
                  )}
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
                    {t('grantApplicationModal.deadline', {
                      timezone:
                        Intl.DateTimeFormat().resolvedOptions().timeZone,
                    })}
                  </FormLabel>
                  <FormHelperText mt={0} mb={2} color="brand.slate.500">
                    {t('grantApplicationModal.deadlineHelper')}
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
                    placeholder={t('grantApplicationModal.deadlinePlaceholder')}
                    type={'date'}
                    {...register('projectTimeline', { required: true })}
                  />
                </FormControl>

                <TextAreaWithCounter
                  id="proofOfWork"
                  label={t('grantApplicationModal.proofOfWork')}
                  helperText={t('grantApplicationModal.proofOfWorkHelper')}
                  placeholder={t(
                    'grantApplicationModal.proofOfWorkPlaceholder',
                  )}
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
                    {t('grantApplicationModal.twitterProfile')}
                  </FormLabel>
                  <FormHelperText mt={0} mb={2} color="brand.slate.500">
                    {t('grantApplicationModal.twitterProfileHelper')}
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
                        placeholder={t(
                          'grantApplicationModal.twitterProfilePlaceholder',
                        )}
                        {...register('twitter', {
                          validate: (value) => {
                            if (
                              !isValidTwitterInput(value) &&
                              !isValidTwitterUsername(value)
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
                    <FormControl key={e?.order} isRequired>
                      <QuestionHandler
                        register={register}
                        question={e?.question}
                        label={`answer-${e?.order}`}
                        watch={watch}
                      />
                    </FormControl>
                  ))}
              </VStack>
            )}
            {activeStep === 2 && (
              <VStack gap={4} mb={5}>
                <TextAreaWithCounter
                  id="milestones"
                  label={t('grantApplicationModal.goalsAndMilestones')}
                  helperText={t(
                    'grantApplicationModal.goalsAndMilestonesHelper',
                  )}
                  placeholder={t(
                    'grantApplicationModal.goalsAndMilestonesPlaceholder',
                  )}
                  register={register}
                  watch={watch}
                  errors={errors}
                  isRequired
                  minH="6rem"
                />
                <TextAreaWithCounter
                  id="kpi"
                  label={t('grantApplicationModal.kpi')}
                  helperText={t('grantApplicationModal.kpiHelper')}
                  placeholder={t('grantApplicationModal.kpiPlaceholder')}
                  register={register}
                  watch={watch}
                  errors={errors}
                  isRequired
                  minH="6rem"
                />
              </VStack>
            )}
            {!!error && (
              <Text align="center" mb={2} color="red">
                {error}
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
                  {t('grantApplicationModal.back')}
                </Button>
              )}
              <Button
                className="ph-no-capture"
                w={'full'}
                isLoading={!!isLoading}
                loadingText={t('grantApplicationModal.applying')}
                type="submit"
                variant="solid"
              >
                {activeStep === steps.length - 1
                  ? t('grantApplicationModal.apply')
                  : t('grantApplicationModal.continue')}
              </Button>
            </Flex>
          </form>
        </VStack>
      </ModalContent>
    </Modal>
  );
};
