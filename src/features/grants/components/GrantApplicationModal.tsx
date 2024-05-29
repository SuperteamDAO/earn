import {
  Box,
  Button,
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
import { PublicKey } from '@solana/web3.js';
import axios from 'axios';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import {
  TextAreaWithCounter,
  TextInputWithHelper,
} from '@/components/Form/TextAreaHelpers';
import { tokenList } from '@/constants';
import { QuestionHandler } from '@/features/listings/';
import { userStore } from '@/store/user';

import { type Grant } from '../types';

interface Props {
  id: string | undefined;
  isOpen: boolean;
  onClose: () => void;
  setHasApplied: (arg0: boolean) => void;
  setApplicationNumber: (arg0: number) => void;
  applicationNumber: number;
  editMode: boolean;
  grant: Grant;
}

export const GrantApplicationModal = ({
  isOpen,
  onClose,
  setHasApplied,
  setApplicationNumber,
  applicationNumber,
  editMode,
  grant,
}: Props) => {
  const { id, questions, token, minReward, maxReward } = grant;

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

  const submitApplication = async (data: any) => {
    setIsLoading(true);
    try {
      const { discordId, twitterId, ask, walletAddress, ...answers } = data;
      const grantAnswers = questions?.map((q: any, index: number) => ({
        question: q.question,
        answer: answers[`eligibility-${index}`],
      }));

      await axios.post('/api/user/update/', {
        publicKey: walletAddress,
      });

      const applicationEndpoint = editMode
        ? '/api/grants/application/update/'
        : '/api/grants/application/create/';

      await axios.post(applicationEndpoint, {
        grantId: id,
        discordId,
        walletAddress,
        twitterId,
        ask: ask || null,
        answers: grantAnswers?.length ? grantAnswers : null,
      });

      reset();
      setHasApplied(true);

      const updatedUser = await axios.post('/api/user/');
      setUserInfo(updatedUser?.data);

      if (!editMode) {
        setApplicationNumber(applicationNumber + 1);
      }

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
      scrollBehavior={'inside'}
      size={'xl'}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader px={{ base: 4, md: 10 }} pt={8} color="brand.slate.800">
          Grant Application
          <Text mt={1} color={'brand.slate.500'} fontSize="sm" fontWeight={400}>
            If you&apos;re working on a project that will help the Solana
            ecosystem grow, apply for any of our grants and we&apos;ll respond
            in 48 hours!
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
              submitApplication(e);
            })}
          >
            <VStack gap={4} mb={5}>
              <TextAreaWithCounter
                id="discordId"
                label="Discord Username"
                helperText="Write the complete discord name, for e.g., akaash#210. Comma separate names in case more than one person has worked on the submission!"
                placeholder="Enter Discord Username"
                register={register}
                watch={watch}
                errors={errors}
              />

              <TextAreaWithCounter
                id="twitterId"
                label="Your Twitter Handle"
                helperText="In case you win, we'll tag you on Twitter. (Only starting from @, avoid the https://.)"
                placeholder="Enter Twitter Handle"
                register={register}
                watch={watch}
                errors={errors}
              />
              {questions?.map((e: any) => (
                <FormControl key={e?.order} isRequired>
                  <QuestionHandler
                    register={register}
                    question={e?.question}
                    label={`eligibility-${e?.order}`}
                    watch={watch}
                  />
                </FormControl>
              ))}

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
                        if (minReward && maxReward) {
                          if (value < minReward || value > maxReward) {
                            setAskError(
                              `Compensation must be between ${minReward} and ${maxReward} ${token}`,
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
                  <>
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
                  </>
                }
                placeholder="Add your Solana wallet address"
                register={register}
                errors={errors}
                validate={validateSolAddress}
                defaultValue={userInfo?.publicKey}
              />
              <Text mt={1} ml={1} color="red" fontSize="14px">
                {publicKeyError}
              </Text>
            </VStack>
            {!!error && (
              <Text align="center" mb={2} color="red">
                Sorry! An error occurred while submitting. <br />
                Please try again or contact us at hello@superteamearn.com
              </Text>
            )}
            <Button
              className="ph-no-capture"
              w={'full'}
              isLoading={!!isLoading}
              loadingText="Submitting..."
              type="submit"
              variant="solid"
            >
              Apply
            </Button>
          </form>
        </VStack>
      </ModalContent>
    </Modal>
  );
};
