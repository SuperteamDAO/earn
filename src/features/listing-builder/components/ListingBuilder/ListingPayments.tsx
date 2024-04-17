import { AddIcon, ChevronDownIcon, DeleteIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Image,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  NumberInput,
  NumberInputField,
  Select,
  Text,
  useDisclosure,
  VStack,
} from '@chakra-ui/react';
import debounce from 'lodash.debounce';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { PrizeList, tokenList } from '@/constants';
import { type Rewards } from '@/features/listings';
import { sortRank } from '@/utils/rank';

import { useListingFormStore } from '../../store';
import { ListingFormLabel, ListingTooltip } from './Form';

interface PrizeListInterface {
  value: string;
  label: string;
  placeHolder: number;
  defaultValue?: number;
}
interface Props {
  isDraftLoading: boolean;
  createDraft: () => void;
  createAndPublishListing: () => void;
  isListingPublishing: boolean;
  editable: boolean;
  isNewOrDraft?: boolean;
  type: 'bounty' | 'project' | 'hackathon';
  isDuplicating?: boolean;
}
export const ListingPayments = ({
  isListingPublishing,
  createDraft,
  isDraftLoading,
  createAndPublishListing,
  editable,
  isNewOrDraft,
  type,
  isDuplicating,
}: Props) => {
  const { form, updateState } = useListingFormStore();
  const {
    isOpen: confirmIsOpen,
    onOpen: confirmOnOpen,
    onClose: confirmOnClose,
  } = useDisclosure();
  const [errorMessage, setErrorMessage] = useState('');
  const [mode, setMode] = useState('');

  const { register, setValue, watch, control, handleSubmit } = useForm({
    defaultValues: {
      compensationType: form?.compensationType,
      rewardAmount: form?.rewardAmount,
      minRewardAsk: form?.minRewardAsk,
      maxRewardAsk: form?.maxRewardAsk,
      token: form?.token,
      rewards: form?.rewards,
    },
  });

  const compensationType = watch('compensationType');
  const rewardAmount = watch('rewardAmount');
  const minRewardAsk = watch('minRewardAsk');
  const maxRewardAsk = watch('maxRewardAsk');
  const token = watch('token');
  const rewards = watch('rewards');

  const [debouncedRewardAmount, setDebouncedRewardAmount] =
    useState(rewardAmount);

  const prizesList = sortRank(Object.keys(rewards || []))?.map((r) => ({
    value: r,
    label: `${r} prize`,
    placeHolder: rewards![r as keyof Rewards] ?? 0,
    defaultValue: rewards![r as keyof Rewards],
  }));
  const [prizes, setPrizes] = useState<PrizeListInterface[]>(
    prizesList?.length
      ? prizesList
      : [
          {
            value: 'first',
            label: 'first prize',
            placeHolder: 2500,
          },
        ],
  );

  const handleTokenChange = (tokenSymbol: string) => {
    setValue('token', tokenSymbol);
  };

  const handlePrizeValueChange = (prizeName: string, value: number) => {
    setValue('rewards', { ...rewards, [prizeName]: value });
  };

  function getPrizeLabels(pri: PrizeListInterface[]): PrizeListInterface[] {
    const labels = ['first', 'second', 'third', 'fourth', 'fifth'];
    return pri.map((prize, index) => ({
      ...prize,
      label: `${labels[index]} prize`,
    }));
  }

  const handlePrizeDelete = (prizeToDelete: keyof Rewards) => {
    const updatedPrizes = prizes.filter(
      (prize) => prize.value !== prizeToDelete,
    );
    setPrizes(getPrizeLabels(updatedPrizes));
    const updatedRewards = { ...rewards };
    delete updatedRewards[prizeToDelete];
    setValue('rewards', updatedRewards, { shouldValidate: true });
  };

  const isProject = type === 'project';

  const onSubmit = async (data: any) => {
    updateState({ ...data });
    if (mode === 'DRAFT') {
      createDraft();
      return;
    }

    let errorMessage = '';

    if (isProject) {
      setValue('rewards', { ...rewards, first: rewardAmount });

      if (!compensationType) {
        errorMessage = 'Please add a compensation type';
      }

      if (compensationType === 'fixed' && !rewardAmount) {
        errorMessage = 'Please specify the total reward amount to proceed';
      } else if (compensationType === 'range') {
        if (!minRewardAsk || !maxRewardAsk) {
          errorMessage =
            'Please specify your preferred minimum and maximum compensation range';
        } else if (maxRewardAsk < minRewardAsk) {
          errorMessage =
            'The compensation range is incorrect; the maximum must be higher than the minimum. Please adjust it';
        }
      }
    } else {
      const totalPrizes = Object.values(rewards || {})
        .map((reward) => reward as number)
        .reduce((a, b) => a + b, 0);

      if (!totalPrizes || rewardAmount !== totalPrizes) {
        errorMessage =
          'Sum of the podium rank amounts does not match the total reward amount. Please check.';
      }
    }

    if (errorMessage) {
      setErrorMessage(errorMessage);
    } else {
      mode === 'EDIT' ? createDraft() : confirmOnOpen();
    }
  };

  let compensationHelperText;

  switch (compensationType) {
    case 'fixed':
      compensationHelperText =
        'Interested applicants will apply if the pay fits their expectations';
      break;
    case 'range':
      compensationHelperText =
        'Allow applicants to send quotes within a specific range';
      break;
    case 'variable':
      compensationHelperText = 'Allow applicants to send quotes of any amount';
      break;
  }

  useEffect(() => {
    const debouncedUpdate = debounce((amount) => {
      setDebouncedRewardAmount(amount);
    }, 700);

    debouncedUpdate(rewardAmount);
    return () => {
      debouncedUpdate.cancel();
    };
  }, [rewardAmount]);
  return (
    <>
      <Modal isOpen={confirmIsOpen} onClose={confirmOnClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Confirm Publishing?</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>
              Publishing this listing means it will show up on the homepage for
              all visitors. Make sure the details in your listing are correct
              before you publish.
            </Text>
          </ModalBody>

          <ModalFooter>
            <Button mr={4} onClick={confirmOnClose} variant="ghost">
              Close
            </Button>
            <Button
              mr={3}
              colorScheme="blue"
              disabled={isListingPublishing}
              isLoading={isListingPublishing}
              loadingText="Publishing..."
              onClick={() => createAndPublishListing()}
            >
              Publish
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <VStack
        align={'start'}
        gap={2}
        w={'2xl'}
        pt={7}
        pb={10}
        color={'gray.500'}
      >
        <form onSubmit={handleSubmit(onSubmit)} style={{ width: '100%' }}>
          {isProject && (
            <Box w="100%" mb={4}>
              <FormControl isRequired>
                <Flex>
                  <ListingFormLabel htmlFor="compensationType">
                    Compensation Type
                  </ListingFormLabel>
                  <ListingTooltip label="Would you like to keep a fixed compensation for this project, or let applicants send in their quotes?" />
                </Flex>
                <Controller
                  control={control}
                  name="compensationType"
                  render={({ field: { onChange, value, ref } }) => (
                    <Select
                      ref={ref}
                      color="brand.slate.900"
                      borderColor="brand.slate.300"
                      onChange={(e) => {
                        onChange(e);
                        setValue('minRewardAsk', undefined);
                        setValue('maxRewardAsk', undefined);
                        setValue('rewards', undefined);
                        setValue('rewardAmount', undefined);
                      }}
                      value={value}
                    >
                      <option hidden disabled value="">
                        Select a Compensation Type
                      </option>
                      <option value="fixed">Fixed Compensation</option>
                      <option value="range">Pre-decided Range</option>
                      <option value="variable">Variable Compensation</option>
                    </Select>
                  )}
                />
              </FormControl>
              <Text mt={1} color="green.500" fontSize={'xs'}>
                {compensationHelperText}
              </Text>
            </Box>
          )}
          <FormControl isRequired>
            <ListingFormLabel htmlFor="token">Select Token</ListingFormLabel>
            <Menu>
              <MenuButton
                as={Button}
                overflow="hidden"
                w="100%"
                h={'2.6rem'}
                color="gray.700"
                fontSize="1rem"
                fontWeight={500}
                textAlign="start"
                bg="transparent"
                border={'1px solid #cbd5e1'}
                _hover={{ bg: 'transparent' }}
                rightIcon={<ChevronDownIcon />}
              >
                {token ? (
                  <HStack>
                    <Image
                      w={'1.6rem'}
                      alt={
                        tokenList.find((t) => t.tokenSymbol === token)
                          ?.tokenName
                      }
                      rounded={'full'}
                      src={tokenList.find((t) => t.tokenSymbol === token)?.icon}
                    />
                    <Text>
                      {
                        tokenList.find((t) => t.tokenSymbol === token)
                          ?.tokenName
                      }
                    </Text>
                  </HStack>
                ) : (
                  <HStack>
                    <Image
                      w={'1.6rem'}
                      alt={tokenList[0]?.tokenName}
                      rounded={'full'}
                      src={tokenList[0]?.icon}
                    />
                    <Text>{tokenList[0]?.tokenName}</Text>
                  </HStack>
                )}
              </MenuButton>
              <MenuList
                overflow="scroll"
                w="40rem"
                maxH="15rem"
                color="gray.600"
                fontSize="1rem"
                fontWeight={500}
              >
                {tokenList.map((token) => {
                  return (
                    <>
                      <MenuItem
                        key={token.mintAddress}
                        onClick={() => handleTokenChange(token.tokenSymbol)}
                      >
                        <HStack>
                          <Image
                            w={'1.6rem'}
                            alt={token.tokenName}
                            rounded={'full'}
                            src={token.icon}
                          />
                          <Text color="gray.600">{token.tokenName}</Text>
                        </HStack>
                      </MenuItem>
                    </>
                  );
                })}
              </MenuList>
            </Menu>
          </FormControl>
          {compensationType === 'fixed' && (
            <FormControl w="full" mt={5} isRequired>
              <ListingFormLabel htmlFor="rewardAmount">
                Total {!isProject ? 'Reward Amount' : 'Compensation'} (in{' '}
                {tokenList.find((t) => t.tokenSymbol === token)?.tokenSymbol})
              </ListingFormLabel>

              <NumberInput focusBorderColor="brand.purple">
                <NumberInputField
                  color={'brand.slate.800'}
                  borderColor="brand.slate.300"
                  _placeholder={{
                    color: 'brand.slate.300',
                  }}
                  {...register('rewardAmount', {
                    required: 'This field is required',
                    setValueAs: (value) => parseInt(value, 10),
                  })}
                  placeholder="4,000"
                />
              </NumberInput>
            </FormControl>
          )}
          {compensationType === 'range' && (
            <Flex gap="3" w="100%">
              <FormControl w="full" mt={5} isRequired>
                <ListingFormLabel htmlFor="minRewardAsk">From</ListingFormLabel>

                <NumberInput focusBorderColor="brand.purple">
                  <NumberInputField
                    color={'brand.slate.800'}
                    borderColor="brand.slate.300"
                    _placeholder={{
                      color: 'brand.slate.300',
                    }}
                    placeholder="Enter the lower range"
                    {...register('minRewardAsk', {
                      required: 'This field is required',
                      setValueAs: (value) => parseInt(value, 10),
                    })}
                  />
                </NumberInput>
              </FormControl>
              <FormControl w="full" mt={5} isRequired>
                <ListingFormLabel htmlFor="minRewardAsk">Upto</ListingFormLabel>

                <NumberInput focusBorderColor="brand.purple">
                  <NumberInputField
                    color={'brand.slate.800'}
                    borderColor="brand.slate.300"
                    _placeholder={{
                      color: 'brand.slate.300',
                    }}
                    placeholder="Enter the higher range"
                    {...register('maxRewardAsk', {
                      required: 'This field is required',
                      setValueAs: (value) => parseInt(value, 10),
                    })}
                  />
                </NumberInput>
              </FormControl>
            </Flex>
          )}
          {type !== 'project' && (
            <VStack gap={4} w={'full'} mt={5}>
              {prizes.map((el, index) => (
                <FormControl key={el.value}>
                  <FormLabel color={'gray.500'} textTransform="capitalize">
                    {el.label}
                  </FormLabel>
                  <Flex gap={3}>
                    <NumberInput
                      w={'100%'}
                      color="brand.slate.500"
                      defaultValue={el.defaultValue}
                      focusBorderColor="brand.purple"
                      onChange={(valueString) =>
                        handlePrizeValueChange(
                          el.value,
                          parseInt(valueString, 10),
                        )
                      }
                    >
                      <NumberInputField
                        color={'brand.slate.800'}
                        borderColor="brand.slate.300"
                        _placeholder={{
                          color: 'brand.slate.300',
                        }}
                        placeholder={JSON.stringify(el.placeHolder)}
                      />
                    </NumberInput>
                    {index === prizes.length - 1 && prizes.length > 1 && (
                      <Button
                        onClick={() =>
                          handlePrizeDelete(el.value as keyof Rewards)
                        }
                      >
                        <DeleteIcon />
                      </Button>
                    )}
                  </Flex>
                </FormControl>
              ))}
              <Button
                w="full"
                isDisabled={prizes.length === 5 && true}
                leftIcon={<AddIcon />}
                onClick={() => {
                  setPrizes([
                    ...prizes,
                    {
                      value: PrizeList[prizes.length] || 'first',
                      label: `${PrizeList[prizes.length]} prize`,
                      placeHolder: (5 - prizes.length) * 500,
                    },
                  ]);
                }}
                variant="ghost"
              >
                Add Prize
              </Button>
            </VStack>
          )}
          <VStack gap={4} w={'full'} mt={10} pt={4}>
            <Text color="yellow.500">
              {!!debouncedRewardAmount &&
                debouncedRewardAmount <= 100 &&
                (token === 'USDT' || 'USDC') &&
                "Note: This listing will not show up on Earn's Landing Page since it is ≤$100 in value. Increase the total compensation for better discoverability."}
            </Text>
            {(isNewOrDraft || isDuplicating) && (
              <Button
                w="100%"
                disabled={isListingPublishing}
                isLoading={isListingPublishing}
                type="submit"
                variant={'solid'}
              >
                Create & Publish Listing
              </Button>
            )}
            <Button
              w="100%"
              isLoading={isDraftLoading}
              onClick={() => {
                if (isNewOrDraft || isDraftLoading) {
                  setMode('DRAFT');
                } else {
                  setMode('EDIT');
                }
                handleSubmit(onSubmit);
              }}
              variant={editable ? 'solid' : 'outline'}
            >
              {isNewOrDraft || isDuplicating ? 'Save Draft' : 'Update Listing'}
            </Button>
            <Text color="red.500">{errorMessage}</Text>
          </VStack>
        </form>
      </VStack>
    </>
  );
};
