import {
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  FormHelperText,
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
import { PublicKey } from '@solana/web3.js';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import { AutoResizeTextarea } from '@/components/shared/autosize-textarea';
import { tokenList } from '@/constants';
import { randomSubmissionCommentGenerator } from '@/features/comments';
import { type Bounty } from '@/features/listings';
import { userStore } from '@/store/user';

import { QuestionHandler } from './QuestionHandler';

interface Props {
  id: string | undefined;
  isOpen: boolean;
  onClose: () => void;
  setIsSubmitted: (arg0: boolean) => void;
  setSubmissionNumber: (arg0: number) => void;
  submissionNumber: number;
  editMode: boolean;
  listing: Bounty;
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
  setIsSubmitted,
  setSubmissionNumber,
  submissionNumber,
  editMode,
  listing,
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
  const isProject = type === 'project';
  const isHackathon = type === 'hackathon';
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

  function validateSolAddress(address: string) {
    try {
      const pubkey = new PublicKey(address);
      const isSolana = PublicKey.isOnCurve(pubkey.toBuffer());
      if (!isSolana) {
        setPublicKeyError('Please enter a valid Solana address');
        return false;
      }
      return true;
    } catch (err) {
      setPublicKeyError('Please enter a valid Solana address');
      return false;
    }
  }

  const submitSubmissions = async (data: any) => {
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
      const eligibilityAnswers = eligibility?.map((q) => ({
        question: q.question,
        answer: answers[`eligibility-${q.order}`],
      }));
      await axios.post('/api/user/update/', {
        publicKey,
      });

      const submissionEndpoint = editMode
        ? '/api/submission/update/'
        : '/api/submission/create/';

      const response = await axios.post(submissionEndpoint, {
        listingId: id,
        link: applicationLink || '',
        tweet: tweetLink || '',
        otherInfo: otherInfo || '',
        ask: ask || null,
        eligibilityAnswers: eligibilityAnswers?.length
          ? eligibilityAnswers
          : null,
      });

      if (!editMode) {
        try {
          await axios.post(`/api/comment/create`, {
            message: randomSubmissionCommentGenerator(type),
            listingId: id,
            submissionId: response?.data?.id,
            type: 'SUBMISSION',
          });
          window.dispatchEvent(new Event('update-comments'));
        } catch (err) {
          console.log(err);
        }
      }

      const latestSubmissionNumber = (userInfo?.Submission?.length ?? 0) + 1;
      if (!editMode) showEasterEgg();
      if (!editMode && latestSubmissionNumber % 3 !== 0) onSurveyOpen();

      reset();
      setIsSubmitted(true);

      const updatedUser = await axios.post('/api/user/');
      setUserInfo(updatedUser?.data);

      if (!editMode) {
        setSubmissionNumber(submissionNumber + 1);
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
      headerText = 'Submit Your Application';
      subheadingText = (
        <>
          Don&apos;t start working just yet! Apply first, and then begin working
          only once you&apos;ve been hired for the project by the sponsor.
          <Text mt={1}>
            Please note that the sponsor might contact you to assess fit before
            picking the winner.
          </Text>
        </>
      );
      break;
    case 'bounty':
      headerText = 'Bounty Submission';
      subheadingText = "We can't wait to see what you've created!";
      break;
    case 'hackathon':
      headerText = 'Hackathon Submission';
      subheadingText = (
        <>
          Share your hackathon submission here! Remember:
          <Text>
            1. In the “Link to your Submission” field, submit your hackathon
            project’s most useful link (could be a loom video, GitHub link,
            website, etc)
          </Text>
          <Text>
            2. To be eligible for different tracks, you need to submit to each
            track separately
          </Text>
          <Text>
            3. There&apos;s no restriction on the number of tracks you can
            submit to
          </Text>
          <Text>
            4. You can mark the Project Website, Project Twitter, and
            Presentation Link fields as &quot;NA&quot; in case you do not have
            these ready at the time of submission.
          </Text>
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
                  <FormControl isRequired>
                    <FormLabel
                      mb={0}
                      color={'brand.slate.600'}
                      fontWeight={600}
                      htmlFor={'applicationLink'}
                    >
                      Link to Your Submission
                    </FormLabel>
                    <FormHelperText mt={0} mb={2} color="brand.slate.500">
                      Make sure this link is accessible by everyone!
                    </FormHelperText>
                    <Input
                      borderColor={'brand.slate.300'}
                      _placeholder={{ color: 'brand.slate.300' }}
                      focusBorderColor="brand.purple"
                      id="applicationLink"
                      placeholder="Add a link"
                      {...register('applicationLink')}
                      maxLength={500}
                    />
                    <Text
                      color={
                        (watch('applicationLink')?.length || 0) > 400
                          ? 'red'
                          : 'brand.slate.400'
                      }
                      fontSize={'xs'}
                      textAlign="right"
                    >
                      {watch('applicationLink')?.length > 300 &&
                        (500 - (watch('applicationLink')?.length || 0) === 0 ? (
                          <p>Character limit reached</p>
                        ) : (
                          <p>
                            {500 - (watch('applicationLink')?.length || 0)}{' '}
                            characters left
                          </p>
                        ))}
                    </Text>
                    <FormErrorMessage>
                      {errors.applicationLink ? (
                        <>{errors.applicationLink.message}</>
                      ) : (
                        <></>
                      )}
                    </FormErrorMessage>
                  </FormControl>
                  <FormControl>
                    <FormLabel
                      mb={0}
                      color={'brand.slate.600'}
                      fontWeight={600}
                      htmlFor={'tweetLink'}
                    >
                      Tweet Link
                    </FormLabel>
                    <FormHelperText mt={0} mb={2} color="brand.slate.500">
                      This helps sponsors discover (and maybe repost) your work
                      on Twitter! If this submission is for a Twitter thread
                      bounty, you can ignore this field.
                    </FormHelperText>
                    <Input
                      borderColor={'brand.slate.300'}
                      _placeholder={{ color: 'brand.slate.300' }}
                      focusBorderColor="brand.purple"
                      id="tweetLink"
                      placeholder="Add a tweet's link"
                      {...register('tweetLink')}
                      maxLength={500}
                    />
                    <Text
                      color={
                        (watch('tweetLink')?.length || 0) > 400
                          ? 'red'
                          : 'brand.slate.400'
                      }
                      fontSize={'xs'}
                      textAlign="right"
                    >
                      {watch('tweetLink')?.length > 300 &&
                        (500 - (watch('tweetLink')?.length || 0) === 0 ? (
                          <p>Character limit reached</p>
                        ) : (
                          <p>
                            {500 - (watch('tweetLink')?.length || 0)} characters
                            left
                          </p>
                        ))}
                    </Text>
                    <FormErrorMessage>
                      {errors.tweetLink ? (
                        <>{errors.tweetLink.message}</>
                      ) : (
                        <></>
                      )}
                    </FormErrorMessage>
                  </FormControl>
                  {isHackathon &&
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
                    What&apos;s the compensation you require to complete this
                    fully?
                  </FormLabel>
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
                                `Compensation must be between ${minRewardAsk} and ${maxRewardAsk} ${token}`,
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
              <FormControl>
                <FormLabel
                  mb={0}
                  color={'brand.slate.600'}
                  fontWeight={600}
                  htmlFor={'otherInfo'}
                >
                  Anything Else?
                </FormLabel>
                <FormHelperText mt={0} mb={2} color="brand.slate.500">
                  If you have any other links or information you&apos;d like to
                  share with us, please add them here!
                </FormHelperText>
                <AutoResizeTextarea
                  borderColor={'brand.slate.300'}
                  _placeholder={{ color: 'brand.slate.300' }}
                  focusBorderColor="brand.purple"
                  id="otherInfo"
                  placeholder="Add info or link"
                  {...register('otherInfo')}
                  maxLength={2000}
                />
                <Text
                  color={
                    (watch('otherInfo')?.length || 0) > 1900
                      ? 'red'
                      : 'brand.slate.400'
                  }
                  fontSize={'xs'}
                  textAlign="right"
                >
                  {watch('otherInfo')?.length > 1800 &&
                    (2000 - (watch('otherInfo')?.length || 0) === 0 ? (
                      <p>Character limit reached</p>
                    ) : (
                      <p>
                        {2000 - (watch('otherInfo')?.length || 0)} characters
                        left
                      </p>
                    ))}
                </Text>

                <FormErrorMessage>
                  {errors.otherInfo ? <>{errors.otherInfo.message}</> : <></>}
                </FormErrorMessage>
              </FormControl>

              <FormControl isRequired>
                <FormLabel
                  mb={0}
                  color={'brand.slate.600'}
                  fontWeight={600}
                  htmlFor={'publicKey'}
                >
                  Your Solana Wallet Address
                </FormLabel>
                <FormHelperText mt={0} mb={2} color="brand.slate.500">
                  Add your Solana wallet address here. This is where you will
                  receive your rewards if you win. Download{' '}
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
                  if you don&apos;t have a Solana wallet
                </FormHelperText>
                <Input
                  borderColor={'brand.slate.300'}
                  _placeholder={{ color: 'brand.slate.300' }}
                  focusBorderColor="brand.purple"
                  id="publicKey"
                  placeholder="Add your Solana wallet address"
                  {...register('publicKey', { validate: validateSolAddress })}
                  defaultValue={userInfo?.publicKey}
                  maxLength={54}
                />
                <Text mt={1} ml={1} color="red" fontSize="14px">
                  {publicKeyError}
                </Text>
              </FormControl>
            </VStack>
            {!!error && (
              <Text align="center" mb={2} color="red">
                Sorry! An error occurred while submitting. <br />
                Please try again or contact us at hello@superteamearn.com
              </Text>
            )}
            <Button
              w={'full'}
              isLoading={!!isLoading}
              loadingText="Submitting..."
              type="submit"
              variant="solid"
            >
              {!isProject ? 'Submit' : 'Apply'}
            </Button>
          </form>
        </VStack>
      </ModalContent>
    </Modal>
  );
};
