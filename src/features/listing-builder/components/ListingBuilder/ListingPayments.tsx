import {
  AddIcon,
  ChevronDownIcon,
  DeleteIcon,
  SearchIcon,
} from '@chakra-ui/icons';
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Image,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  List,
  ListItem,
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
import { type ListingFormType } from '../../types';
import { ListingFormLabel, ListingTooltip } from './Form';

interface Token {
  tokenName: string;
  tokenSymbol: string;
  mintAddress: string;
  icon: string;
  decimals: number;
  coingeckoSymbol: string;
  livecoinwatchSymbol: string;
}

interface PrizeListInterface {
  value: string;
  label: string;
  placeHolder: number;
  defaultValue?: number;
}
interface Props {
  isDraftLoading: boolean;
  createDraft: (data: ListingFormType) => Promise<void>;
  createAndPublishListing: () => void;
  isListingPublishing: boolean;
  editable: boolean;
  isNewOrDraft?: boolean;
  type: 'bounty' | 'project' | 'hackathon';
  isDuplicating?: boolean;
}
interface SearchState {
  searchTerm: string | undefined;
  tokenImage: string | undefined;
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

  const [searchResults, setSearchResults] = useState<Token[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedTokenIndex, setSelectedTokenIndex] = useState<number | null>(
    null,
  );

  const { register, setValue, watch, control, handleSubmit, reset, getValues } =
    useForm({
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

  const [searchState, setSearchState] = useState<SearchState>({
    searchTerm: undefined,
    tokenImage: tokenList.find((t) => t.tokenSymbol === token)?.icon,
  });

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

  useEffect(() => {
    if (editable) {
      reset({
        compensationType: form?.compensationType,
        rewardAmount: form?.rewardAmount || undefined,
        minRewardAsk: form?.minRewardAsk || undefined,
        maxRewardAsk: form?.maxRewardAsk || undefined,
        rewards: form?.rewards || undefined,
        token: form?.token || 'USDC',
      });
    }
  }, [form]);

  const handleTokenChange = (tokenSymbol: string | undefined) => {
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

  const validateRewardsData = () => {
    let errorMessage = '';

    if (searchState.searchTerm) {
      const tokenSym = tokenList.find(
        (t) =>
          t.tokenName.toLowerCase() === searchState.searchTerm!.toLowerCase(),
      );
      if (!tokenSym) {
        errorMessage = 'Please select a valid token';
      }
    }

    if (isProject) {
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
      if (rewardAmount !== undefined) {
        const totalPrizes = Object.values(rewards || {})
          .map((reward) => parseFloat(reward.toFixed(2)))
          .reduce((a, b) => a + b, 0)
          .toFixed(2);

        if (
          !totalPrizes ||
          parseFloat(rewardAmount.toFixed(2)) !== parseFloat(totalPrizes)
        ) {
          errorMessage =
            'Sum of the podium rank amounts does not match the total reward amount. Please check.';
        }
      } else {
        errorMessage = 'Total reward amount is not specified';
      }
    }

    return errorMessage;
  };

  const handleSaveDraft = async () => {
    const data = getValues();
    const formData = { ...form, ...data };
    createDraft(formData);
  };

  const handleUpdateListing = async () => {
    const errorMessage = validateRewardsData();
    const data = getValues();
    const formData = { ...form, ...data };
    if (errorMessage) {
      setErrorMessage(errorMessage);
    } else {
      createDraft(formData);
    }
  };

  const handleSearch = (value: string) => {
    setSearchState({ searchTerm: value, tokenImage: '' });
    setIsOpen(true);
    if (value === '') {
      setSearchResults(tokenList);
    } else {
      const filteredResults = tokenList.filter((token) =>
        token.tokenName.toLowerCase().includes(value.toLowerCase()),
      );
      setSearchResults(filteredResults);
    }
    setSelectedTokenIndex(null);
  };

  const handleSelectToken = (
    tokenName: string | undefined,
    icon: string | undefined,
  ) => {
    setSearchState({ searchTerm: tokenName, tokenImage: icon });
    setIsOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setSelectedTokenIndex((prevIndex) =>
        prevIndex === null || prevIndex === searchResults.length - 1
          ? 0
          : prevIndex + 1,
      );
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setSelectedTokenIndex((prevIndex) =>
        prevIndex === null || prevIndex === 0
          ? searchResults.length - 1
          : prevIndex - 1,
      );
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (selectedTokenIndex !== null) {
        const selectedToken = searchResults[selectedTokenIndex];
        handleTokenChange(selectedToken?.tokenSymbol);
        handleSelectToken(selectedToken?.tokenName, selectedToken?.icon);
      }
    }
  };

  const onSubmit = async (data: any) => {
    const errorMessage = validateRewardsData();
    let newState = { ...data };
    if (isProject) {
      if (compensationType === 'fixed') {
        newState = { ...data, rewards: { first: rewardAmount } };
      } else {
        newState = { ...data, rewards: { first: 0 } };
      }
    }
    updateState(newState);
    if (errorMessage) {
      setErrorMessage(errorMessage);
    } else {
      confirmOnOpen();
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

  const isDraft = isNewOrDraft || isDuplicating;

  useEffect(() => {
    const debouncedUpdate = debounce((amount) => {
      setDebouncedRewardAmount(amount);
    }, 700);

    debouncedUpdate(rewardAmount);
    return () => {
      debouncedUpdate.cancel();
    };
  }, [rewardAmount]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const input = document.getElementById('search-input');
      if (input && !input.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <>
      <Modal isOpen={confirmIsOpen} onClose={confirmOnClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Confirm Publishing?</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>
              {form?.isPrivate
                ? 'This listing will only be accessible via the link — and will not show up anywhere else on the site — since it has been marked as a "Private Listing"'
                : 'Publishing this listing means it will show up on the homepage for all visitors. Make sure the details in your listing are correct before you publish.'}
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
        pt={5}
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
          <FormControl pos="relative">
            <ListingFormLabel>Select Token</ListingFormLabel>
            <InputGroup>
              {token && (
                <>
                  <InputLeftElement
                    alignItems={'center'}
                    justifyContent={'start'}
                    ml={4}
                  >
                    <SearchIcon color="gray.300" mr={2} />
                    {searchState.tokenImage === undefined ? (
                      <Image
                        w={'1.6rem'}
                        alt={
                          tokenList.find((t) => t.tokenSymbol === token)
                            ?.tokenName
                        }
                        rounded={'full'}
                        src={
                          tokenList.find((t) => t.tokenSymbol === token)?.icon
                        }
                      />
                    ) : searchState.tokenImage !== undefined &&
                      searchState.tokenImage !== '' ? (
                      <Image
                        w={'1.6rem'}
                        alt={searchState.searchTerm as string}
                        rounded={'full'}
                        src={searchState.tokenImage}
                      />
                    ) : (
                      <></>
                    )}
                  </InputLeftElement>
                </>
              )}
              <Input
                pl={
                  searchState.tokenImage !== undefined &&
                  searchState.tokenImage !== ''
                    ? '4.5rem'
                    : '3rem'
                }
                color="gray.700"
                fontSize="1rem"
                fontWeight={500}
                border={'1px solid #cbd5e1'}
                focusBorderColor="brand.purple"
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => {
                  if (
                    (!searchState.searchTerm ||
                      searchState.searchTerm === '') &&
                    !editable
                  ) {
                    handleSearch('');
                  } else {
                    setIsOpen(true);
                  }
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search token"
                value={
                  searchState.searchTerm === undefined
                    ? tokenList.find((t) => t.tokenSymbol === token)?.tokenName
                    : (searchState.searchTerm as string)
                }
              />
              <InputRightElement color="gray.700" fontSize="1rem">
                <ChevronDownIcon />
              </InputRightElement>
            </InputGroup>
            {searchResults.length > 0 && isOpen && (
              <List
                pos={'absolute'}
                zIndex={10}
                overflowX="hidden"
                w="full"
                maxH="15rem"
                pt={1}
                color="gray.600"
                bg={'white'}
                border={'1px solid #cbd5e1'}
                borderBottomRadius={'lg'}
                id="search-input"
              >
                {searchResults.map((token, index) => (
                  <ListItem
                    key={token.tokenName}
                    bg={
                      selectedTokenIndex === index ? 'gray.200' : 'transparent'
                    }
                    _hover={{ background: 'gray.100' }}
                    cursor="pointer"
                    onClick={() => {
                      handleTokenChange(token.tokenSymbol);
                      handleSelectToken(token.tokenName, token.icon);
                    }}
                  >
                    <HStack px={3} py={2}>
                      <Image
                        w={'1.6rem'}
                        alt={token.tokenName}
                        rounded={'full'}
                        src={token.icon}
                      />
                      <Text>{token.tokenName}</Text>
                    </HStack>
                  </ListItem>
                ))}
              </List>
            )}
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
                    setValueAs: (value) => parseFloat(value),
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
                      setValueAs: (value) => parseFloat(value),
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
                      setValueAs: (value) => parseFloat(value),
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
                          parseFloat(valueString),
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
                (token === 'USDT' || token === 'USDC') &&
                "Note: This listing will not show up on Earn's Landing Page since it is ≤$100 in value. Increase the total compensation for better discoverability."}
            </Text>
            {isDraft && (
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
                if (isDraft) {
                  handleSaveDraft();
                } else {
                  handleUpdateListing();
                }
              }}
              variant={isDraft ? 'outline' : 'solid'}
            >
              {isDraft ? 'Save Draft' : 'Update Listing'}
            </Button>
            <Text color="red.500">{errorMessage}</Text>
          </VStack>
        </form>
      </VStack>
    </>
  );
};
