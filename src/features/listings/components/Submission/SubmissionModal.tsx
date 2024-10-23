import {
  Box,
  Button,
  Checkbox,
  Flex,
  FormControl,
  FormLabel,
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
  Text,
  VStack,
} from '@chakra-ui/react';
import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { usePostHog } from 'posthog-js/react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import {
  TextAreaWithCounter,
  TextInputWithHelper,
} from '@/components/Form/TextAreaHelpers';
import { tokenList } from '@/constants';
import { useUpdateUser, useUser } from '@/store/user';
import { validateSolAddress } from '@/utils/validateSolAddress';

import { submissionCountQuery } from '../../queries';
import { userSubmissionQuery } from '../../queries/user-submission-status';
import { type Listing } from '../../types';
import { isValidUrl } from '../../utils';
import { QuestionHandler } from './QuestionHandler';
import { SubmissionTerms } from './SubmissionTerms';

interface Props {
  id: string | undefined;
  isOpen: boolean;
  onClose: () => void;
  editMode: boolean;
  listing: Listing;
  isTemplate?: boolean;
  showEasterEgg: () => void;
  onSurveyOpen: () => void;
}

interface EligibilityAnswer {
  question: string;
  answer: string;
}

type FormFields = Record<string, string>;

export const SubmissionModal = ({
  isOpen,
  onClose,
  editMode,
  listing,
  isTemplate = false,
  showEasterEgg,
  onSurveyOpen,
}: Props) => {
  const {
    id,
    type,
    eligibility,
    compensationType,
    token,
    minRewardAsk,
    maxRewardAsk,
  } = listing;

  const queryClient = useQueryClient();

  const [eligibilityQs, setEligibilityQs] = useState(
    eligibility?.map((q) => ({
      ...q,
      error: '',
    })),
  );
  const isProject = type === 'project';
  const isHackathon = type === 'hackathon';
  const [isLoading, setIsLoading] = useState(false);
  const [isTOSModalOpen, setIsTOSModalOpen] = useState(false);
  const [error, setError] = useState<any>('');
  const [publicKeyError, setPublicKeyError] = useState('');
  const [askError, setAskError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm();

  const { user, refetchUser } = useUser();
  const updateUser = useUpdateUser();
  const posthog = usePostHog();
  const { t } = useTranslation();

  useEffect(() => {
    const fetchData = async () => {
      if (editMode && id) {
        try {
          const response = await axios.get('/api/submission/get/', {
            params: { id },
          });

          const {
            link: applicationLink,
            tweet: tweetLink,
            otherInfo,
            eligibilityAnswers,
            ask,
          } = response.data;

          let formData = {
            applicationLink,
            tweetLink,
            otherInfo,
            ask,
          };

          if ((isProject || isHackathon) && eligibility) {
            const transformedAnswers = eligibilityAnswers.reduce(
              (acc: FormFields, curr: EligibilityAnswer) => {
                const index = eligibility.findIndex(
                  (e) => e.question === curr.question,
                );

                if (index !== -1) {
                  acc[`eligibility-${eligibility[index]!.order}`] = curr.answer;
                }

                return acc;
              },
              {} as FormFields,
            );
            formData = { ...formData, ...transformedAnswers };
          }

          reset(formData);
        } catch (error) {
          console.error('Failed to fetch submission data', error);
        }
      }
    };

    fetchData();
  }, [id, editMode, reset]);

  const submitSubmissions = async (data: any) => {
    posthog.capture('confirmed_submission');
    setIsLoading(true);
    try {
      const {
        applicationLink,
        tweetLink,
        otherInfo,
        ask,
        publicKey,
        ...answers
      } = data;
      const eligibilityAnswers =
        eligibility?.map((q) => ({
          question: q.question,
          answer: answers[`eligibility-${q.order}`],
        })) ?? [];
      if (user?.publicKey !== publicKey) {
        await updateUser.mutateAsync({ publicKey });
      }

      const submissionEndpoint = editMode
        ? '/api/submission/update/'
        : '/api/submission/create/';

      await axios.post(submissionEndpoint, {
        listingId: id,
        link: applicationLink || '',
        tweet: tweetLink || '',
        otherInfo: otherInfo || '',
        ask: ask || null,
        eligibilityAnswers: eligibilityAnswers?.length
          ? eligibilityAnswers
          : null,
      });

      const hideEasterEggFromSponsorIds = [
        '53cbd2eb-14e5-4b8a-b6fe-e18e0c885145', // network schoool
      ];

      const latestSubmissionNumber = (user?.Submission?.length ?? 0) + 1;
      if (
        !editMode &&
        latestSubmissionNumber === 1 &&
        !hideEasterEggFromSponsorIds.includes(listing.sponsorId || '')
      )
        showEasterEgg();
      if (!editMode && latestSubmissionNumber % 3 !== 0) onSurveyOpen();

      reset();
      await queryClient.invalidateQueries({
        queryKey: userSubmissionQuery(id!, user!.id).queryKey,
      });

      await refetchUser();

      if (!editMode) {
        await queryClient.invalidateQueries({
          queryKey: submissionCountQuery(id!).queryKey,
        });
      }

      onClose();
    } catch (e) {
      setError('Sorry! Please try again or contact support.');
      setIsLoading(false);
    }
  };

  let headerText = '';
  let subheadingText: JSX.Element | string = '';
  switch (type) {
    case 'project':
      headerText = t('SubmissionModal.submitYourApplication');
      subheadingText = (
        <>
          {t('SubmissionModal.dontStartWorkingYet')}
          <Text mt={1}>{t('SubmissionModal.sponsorMayContact')}</Text>
        </>
      );
      break;
    case 'bounty':
      headerText = t('SubmissionModal.bountySubmission');
      subheadingText = t('SubmissionModal.cantWaitToSee');
      break;
    case 'hackathon':
      headerText = t('SubmissionModal.solanaRadarTrackSubmission');
      subheadingText = (
        <>
          {t('SubmissionModal.note')}:
          <Text>{t('SubmissionModal.submissionLinkNote')}</Text>
          <Text>{t('SubmissionModal.separateSubmissionsNote')}</Text>
          <Text>{t('SubmissionModal.noRestrictionNote')}</Text>
        </>
      );
      break;
  }

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
          {headerText}
          <Text mt={1} color={'brand.slate.500'} fontSize="sm" fontWeight={400}>
            {subheadingText}
          </Text>
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
              submitSubmissions(e);
            })}
          >
            <VStack gap={4} mb={5}>
              {!isProject ? (
                <>
                  <TextAreaWithCounter
                    id="applicationLink"
                    label={t('SubmissionModal.linkToYourSubmission')}
                    helperText={t('SubmissionModal.makeSureLinkAccessible')}
                    placeholder={t('SubmissionModal.addALink')}
                    register={register}
                    watch={watch}
                    maxLength={500}
                    errors={errors}
                    isRequired
                  />
                  <TextAreaWithCounter
                    id="tweetLink"
                    label={t('SubmissionModal.tweetLink')}
                    helperText={t('SubmissionModal.tweetLinkHelperText')}
                    placeholder={t('SubmissionModal.addTweetLink')}
                    register={register}
                    watch={watch}
                    maxLength={500}
                    errors={errors}
                  />
                  {isHackathon &&
                    eligibilityQs?.map((e, i) => {
                      return (
                        <FormControl
                          key={e?.order}
                          isRequired={e.optional !== true}
                        >
                          <QuestionHandler
                            error={isHackathon && e.error}
                            validate={(value: string) => {
                              if (!isHackathon) return true;
                              if (value && e.isLink) {
                                if (!isValidUrl(value) && eligibilityQs[i]) {
                                  const cloneEligibilityQs = [...eligibilityQs];
                                  const currElgibile = cloneEligibilityQs[i];
                                  if (currElgibile) {
                                    currElgibile.error =
                                      'Please enter a valid link';
                                    setEligibilityQs(cloneEligibilityQs);
                                    return false;
                                  }
                                }
                              }
                              return true;
                            }}
                            register={register}
                            question={e?.question}
                            label={`eligibility-${e?.order}`}
                            watch={watch}
                          />
                        </FormControl>
                      );
                    })}
                </>
              ) : (
                eligibility?.map((e) => {
                  return (
                    <FormControl key={e?.order} isRequired>
                      <QuestionHandler
                        register={register}
                        question={e?.question}
                        label={`eligibility-${e?.order}`}
                        watch={watch}
                      />
                    </FormControl>
                  );
                })
              )}
              {compensationType !== 'fixed' && (
                <FormControl isRequired>
                  <FormLabel
                    mb={1}
                    color={'brand.slate.600'}
                    fontWeight={600}
                    htmlFor={'ask'}
                  >
                    {t('SubmissionModal.compensationRequired')}
                  </FormLabel>
                  <InputGroup>
                    <InputLeftAddon>
                      <Image
                        w={4}
                        h={4}
                        alt={t('SubmissionModal.greenDollar')}
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
                      focusBorderColor="brand.purple"
                      id="ask"
                      {...register('ask', {
                        valueAsNumber: true,
                        validate: (value) => {
                          if (
                            compensationType === 'range' &&
                            minRewardAsk &&
                            maxRewardAsk
                          ) {
                            if (value < minRewardAsk || value > maxRewardAsk) {
                              setAskError(
                                t('SubmissionModal.compensationRangeError', {
                                  minRewardAsk,
                                  maxRewardAsk,
                                  token,
                                }),
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
              )}
              <TextAreaWithCounter
                id="otherInfo"
                label={t('SubmissionModal.anythingElse')}
                helperText={t('SubmissionModal.otherInfoHelperText')}
                placeholder={t('SubmissionModal.addInfoOrLink')}
                register={register}
                watch={watch}
                maxLength={2000}
                errors={errors}
              />

              <TextInputWithHelper
                id="publicKey"
                label={t('SubmissionModal.yourSolanaWalletAddress')}
                helperText={
                  <>
                    {t('SubmissionModal.addSolanaWalletHelperText')}{' '}
                    <Text as="u">
                      <Link href="https://backpack.app" isExternal>
                        Backpack
                      </Link>
                    </Text>{' '}
                    /{' '}
                    <Text as="u">
                      <Link href="https://solflare.com" isExternal>
                        Solflare
                      </Link>
                    </Text>{' '}
                    {t('SubmissionModal.ifYouDontHaveWallet')}
                  </>
                }
                placeholder={t('SubmissionModal.addYourSolanaWalletAddress')}
                register={register}
                errors={errors}
                validate={(address: string) =>
                  validateSolAddress(address, setPublicKeyError)
                }
                defaultValue={user?.publicKey}
              />
              <Text mt={1} ml={1} color="red" fontSize="14px">
                {publicKeyError}
              </Text>
              {isHackathon && !editMode && (
                <FormControl isRequired>
                  <Flex align="flex-start">
                    <Checkbox
                      mt={1}
                      mr={2}
                      _checked={{
                        '& .chakra-checkbox__control': {
                          background: 'brand.purple',
                          borderColor: 'brand.purple',
                        },
                      }}
                    />
                    <Text
                      alignSelf="center"
                      color={'brand.slate.600'}
                      fontSize={'sm'}
                    >
                      {t('SubmissionModal.confirmationText')}
                    </Text>
                  </Flex>
                </FormControl>
              )}
            </VStack>
            {!!error && (
              <Text align="center" mb={2} color="red">
                {t('SubmissionModal.errorMessage')}
              </Text>
            )}
            <Button
              className="ph-no-capture"
              w={'full'}
              isDisabled={isTemplate || listing.status === 'PREVIEW'}
              isLoading={!!isLoading}
              loadingText={t('SubmissionModal.submitting')}
              type="submit"
              variant="solid"
            >
              {!isProject
                ? t('SubmissionModal.submit')
                : t('SubmissionModal.apply')}
            </Button>
            <Text
              mt={2}
              color="brand.slate.400"
              fontSize="sm"
              textAlign="center"
            >
              {t('SubmissionModal.termsAgreement')}{' '}
              <Link
                textDecoration={'underline'}
                onClick={() => setIsTOSModalOpen(true)}
                rel="noopener noreferrer"
                target="_blank"
                textUnderlineOffset={2}
              >
                {t('SubmissionModal.termsOfUse')}
              </Link>
              .
            </Text>
          </form>
        </VStack>
        {listing?.sponsor?.name && (
          <SubmissionTerms
            entityName={listing.sponsor.entityName}
            isOpen={isTOSModalOpen}
            onClose={() => setIsTOSModalOpen(false)}
            sponsorName={listing.sponsor.name}
          />
        )}
      </ModalContent>
    </Modal>
  );
};
