import {
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Input,
  Link,
  Modal,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack,
} from '@chakra-ui/react';
import type { BountyType } from '@prisma/client';
import { PublicKey } from '@solana/web3.js';
import axios from 'axios';
import { useState } from 'react';
import type { FieldValues, UseFormRegister } from 'react-hook-form';
import { useForm } from 'react-hook-form';

import type { Eligibility } from '@/features/listings';
import { userStore } from '@/store/user';

import { AutoResizeTextarea } from '../shared/autosize-textarea';

interface Props {
  id: string;
  isOpen: boolean;
  onClose: () => void;
  eligibility: Eligibility[];
  setIsSubmitted: (arg0: boolean) => void;
  setSubmissionNumber: (arg0: number) => void;
  submissionNumber: number;
  type?: BountyType | string;
}

interface QuestionProps {
  question: string;
  label: string;
  register: UseFormRegister<FieldValues>;
  watch?: any;
}

const QuestionHandler = ({
  question,
  register,
  label,
  watch,
}: QuestionProps) => {
  return (
    <>
      <FormLabel mb={1} color={'brand.slate.600'} fontWeight={600}>
        {question}
      </FormLabel>
      <AutoResizeTextarea
        borderColor={'brand.slate.300'}
        _placeholder={{ color: 'brand.slate.300' }}
        focusBorderColor="brand.purple"
        maxLength={3000}
        {...register(label)}
      />
      <Text
        color={(watch(label)?.length || 0) > 2900 ? 'red' : 'brand.slate.400'}
        fontSize={'xs'}
        textAlign="right"
      >
        {watch(label)?.length > 2500 &&
          (3000 - (watch(label)?.length || 0) === 0 ? (
            <p>Character limit reached</p>
          ) : (
            <p>{3000 - (watch(label)?.length || 0)} characters left</p>
          ))}
      </Text>
    </>
  );
};

export const SubmissionModal = ({
  id,
  isOpen,
  onClose,
  eligibility,
  setIsSubmitted,
  setSubmissionNumber,
  submissionNumber,
  type,
}: Props) => {
  const isProject = type === 'project';
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [publicKeyError, setPublicKeyError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm();

  const { userInfo } = userStore();

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
      const { applicationLink, tweetLink, otherInfo, publicKey, ...answers } =
        data;
      const eligibilityAnswers = eligibility.map((q) => ({
        question: q.question,
        answer: answers[`eligibility-${q.order}`],
      }));
      await axios.post('/api/user/update', {
        publicKey,
      });

      await axios.post('/api/submission/create/', {
        listingId: id,
        listingType: 'BOUNTY',
        link: applicationLink || '',
        tweet: tweetLink || '',
        otherInfo: otherInfo || '',
        eligibilityAnswers: eligibilityAnswers.length
          ? eligibilityAnswers
          : null,
      });
      await axios.post(`/api/email/manual/submission`, {
        listingId: id,
      });

      reset();
      setIsSubmitted(true);
      setSubmissionNumber(submissionNumber + 1);

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
            1. To be eligible for different tracks, you need to submit to each
            track separately
          </Text>
          <Text>
            2. There&apos;s no restriction on the number of tracks you can
            submit to
          </Text>
          <Text>3. You can submit only one entry to each track</Text>
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
        <ModalHeader color="brand.slate.800">{headerText}</ModalHeader>
        <ModalCloseButton />
        <VStack
          align={'start'}
          gap={3}
          overflow={'scroll'}
          maxH={'50rem'}
          px={6}
          pb={6}
        >
          <Box>
            <Text mb={1} color={'brand.slate.500'} fontSize="sm">
              {subheadingText}
            </Text>
          </Box>
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
                      Link to your submission
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
              <FormControl>
                <FormLabel
                  mb={0}
                  color={'brand.slate.600'}
                  fontWeight={600}
                  htmlFor={'tweetLink'}
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
                    <Link href="https://phantom.app" isExternal>
                      Phantom
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
