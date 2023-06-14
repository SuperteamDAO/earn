import {
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Input,
  Modal,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack,
} from '@chakra-ui/react';
import type { BountyType } from '@prisma/client';
import axios from 'axios';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { QuestionHandler } from '@/components/listings/bounty/questions/questionHandler';
import type { Eligibility } from '@/interface/bounty';
import { userStore } from '@/store/user';
import { Mixpanel } from '@/utils/mixpanel';

interface Props {
  id: string;
  isOpen: boolean;
  onClose: () => void;
  eligibility: Eligibility[];
  setIsSubmitted: (arg0: boolean) => void;
  setSubmissionNumber: (arg0: number) => void;
  submissionNumber: number;
  bountytitle: string;
  type?: BountyType | string;
}
export const SubmissionModal = ({
  id,
  isOpen,
  onClose,
  eligibility,
  setIsSubmitted,
  setSubmissionNumber,
  submissionNumber,
  bountytitle,
  type,
}: Props) => {
  const isPermissioned =
    type === 'permissioned' && eligibility && eligibility?.length > 0;
  const { userInfo } = userStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const submitSubmissions = async (data: any) => {
    setIsLoading(true);
    try {
      const { applicationLink, tweetLink, otherInfo, ...answers } = data;
      const eligibilityAnswers = eligibility.map((q) => ({
        question: q.question,
        answer: answers[`eligibility-${q.order}`],
      }));
      await axios.post('/api/submission/create/', {
        userId: userInfo?.id,
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
        userId: userInfo?.id,
      });
      Mixpanel.track('bounty_submission', {
        title: bountytitle,
        user: userInfo?.username,
      });
      setIsSubmitted(true);
      setSubmissionNumber(submissionNumber + 1);

      onClose();
    } catch (e) {
      setError('Sorry! Please try again or contact support.');
      setIsLoading(false);
    }
  };

  return (
    <Modal
      closeOnOverlayClick={false}
      isCentered
      isOpen={isOpen}
      onClose={onClose}
      size={'xl'}
    >
      <ModalOverlay></ModalOverlay>
      <ModalContent>
        <ModalHeader color="brand.slate.800">Bounty Submission</ModalHeader>
        <ModalCloseButton />
        <VStack
          align={'start'}
          gap={3}
          overflow={'scroll'}
          maxH={'50rem'}
          pb={6}
          px={6}
        >
          <Box>
            <Text mb={1} color={'brand.slate.500'} fontSize="sm">
              {isPermissioned
                ? `This is a permissioned bounty - which means only the applicant that the sponsor will select will be eligible to work on this bounty`
                : `We can't wait to see what you've created!`}
            </Text>
            <Text color={'brand.slate.500'} fontSize="sm">
              {!!isPermissioned &&
                'Please note that bounties typically take ~5 days after the end date to be evaluated.'}
            </Text>
          </Box>
          <form
            style={{ width: '100%' }}
            onSubmit={handleSubmit((e) => {
              submitSubmissions(e);
            })}
          >
            <VStack gap={4} mb={5}>
              {!isPermissioned ? (
                <>
                  <FormControl isRequired>
                    <FormLabel
                      mb={0}
                      color={'brand.slate.800'}
                      fontWeight={600}
                      htmlFor={'applicationLink'}
                    >
                      Link to your submission
                    </FormLabel>
                    <FormHelperText mt={0} mb={2} color="brand.slate.500">
                      We prefer Medium, Substack, Notion, etc., link for written
                      content, and Figma for design content.
                    </FormHelperText>
                    <Input
                      borderColor={'brand.slate.300'}
                      _placeholder={{ color: 'brand.slate.300' }}
                      focusBorderColor="brand.purple"
                      id="applicationLink"
                      placeholder="Add a link"
                      {...register('applicationLink')}
                    />
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
                      color={'brand.slate.800'}
                      fontWeight={600}
                      htmlFor={'tweetLink'}
                    >
                      Tweet Link
                    </FormLabel>
                    <FormHelperText mt={0} mb={2} color="brand.slate.500">
                      We generally recommend tweeting out your work so that (1)
                      we can further share the best entries, and (2) its easier
                      for partner projects to discover you too! In case you
                      tweet it out, give us a link to the Tweet here!
                    </FormHelperText>
                    <Input
                      borderColor={'brand.slate.300'}
                      _placeholder={{ color: 'brand.slate.300' }}
                      focusBorderColor="brand.purple"
                      id="tweetLink"
                      placeholder="Add a tweet's link"
                      {...register('tweetLink')}
                    />
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
                        type={e?.type ?? 'text'}
                        label={`eligibility-${e?.order}`}
                      />
                    </FormControl>
                  );
                })
              )}
              <FormControl>
                <FormLabel
                  mb={0}
                  color={'brand.slate.800'}
                  fontWeight={600}
                  htmlFor={'tweetLink'}
                >
                  Anything Else?
                </FormLabel>
                <FormHelperText mt={0} mb={2} color="brand.slate.500">
                  If you have any other links or information you&apos;d like to
                  share with us, please add them here!
                </FormHelperText>
                <Input
                  borderColor={'brand.slate.300'}
                  _placeholder={{ color: 'brand.slate.300' }}
                  focusBorderColor="brand.purple"
                  id="otherInfo"
                  placeholder="Add info or link"
                  {...register('otherInfo')}
                />
                <FormErrorMessage>
                  {errors.otherInfo ? <>{errors.otherInfo.message}</> : <></>}
                </FormErrorMessage>
              </FormControl>
            </VStack>
            {!!error && (
              <Text align="center" mb={2} color="red">
                Sorry! Error occurred which submitting application. <br />
                Please try again or contact support.
              </Text>
            )}
            <Button
              w={'full'}
              isLoading={!!isLoading}
              loadingText="Submitting..."
              type="submit"
              variant="solid"
            >
              {!isPermissioned ? 'Submit' : 'Apply'}
            </Button>
          </form>
        </VStack>
      </ModalContent>
    </Modal>
  );
};
