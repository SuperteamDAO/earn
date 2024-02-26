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
  Tooltip,
  useDisclosure,
  VStack,
} from '@chakra-ui/react';
import { useState } from 'react';

import { type MultiSelectOptions, PrizeList, tokenList } from '@/constants';
import { sortRank } from '@/utils/rank';

import type { BountyBasicType } from '../CreateListingForm';
import type { Ques } from './QuestionBuilder';

interface PrizeListInterface {
  value: string;
  label: string;
  placeHolder: number;
  defaultValue?: number;
}
interface Props {
  bountyBasic: BountyBasicType | undefined;
  editorData: string | undefined;
  mainSkills: MultiSelectOptions[];
  subSkills: MultiSelectOptions[];
  onOpen: () => void;
  draftLoading: boolean;
  createDraft: () => void;
  questions: Ques[];
  createAndPublishListing: () => void;
  isListingPublishing: boolean;
  bountyPayment: any;
  editable: boolean;
  isNewOrDraft?: boolean;
  type: 'bounty' | 'project' | 'hackathon';
  isDuplicating?: boolean;
  bountyPaymentDispatch: any;
}
export const ListingPayments = ({
  createDraft,
  draftLoading,
  createAndPublishListing,
  isListingPublishing,
  bountyPayment,
  bountyPaymentDispatch,
  editable,
  isNewOrDraft,
  type,
  isDuplicating,
}: Props) => {
  const {
    isOpen: confirmIsOpen,
    onOpen: confirmOnOpen,
    onClose: confirmOnClose,
  } = useDisclosure();
  const [errorMessage, setErrorMessage] = useState('');

  // handles the UI for prize
  const prizesList = sortRank(Object.keys(bountyPayment?.rewards || []))?.map(
    (r) => ({
      value: r,
      label: `${r} prize`,
      placeHolder: bountyPayment?.rewards[r],
      defaultValue: bountyPayment?.rewards[r],
    }),
  );
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
    bountyPaymentDispatch({ type: 'UPDATE_TOKEN', payload: tokenSymbol });
  };

  const handleTotalRewardChange = (valueString: string) => {
    const newTotalReward = parseInt(valueString, 10) || 0;
    bountyPaymentDispatch({
      type: 'UPDATE_REWARD_AMOUNT',
      payload: newTotalReward,
    });
  };

  const handlePrizeValueChange = (prizeName: string, value: number) => {
    bountyPaymentDispatch({
      type: 'UPDATE_REWARDS',
      payload: { [prizeName]: value },
    });
  };

  const handleMinAskChange = (value: string) => {
    const minAsk = parseInt(value, 10) || 0;
    bountyPaymentDispatch({
      type: 'UPDATE_MIN_ASK',
      payload: minAsk,
    });
  };

  const handleMaxAskChange = (value: string) => {
    const maxAsk = parseInt(value, 10) || 0;
    bountyPaymentDispatch({
      type: 'UPDATE_MAX_ASK',
      payload: maxAsk,
    });
  };

  function getPrizeLabels(pri: PrizeListInterface[]): PrizeListInterface[] {
    const labels = ['first', 'second', 'third', 'fourth', 'fifth'];
    return pri.map((prize, index) => ({
      ...prize,
      label: `${labels[index]} prize`,
    }));
  }

  const handlePrizeDelete = (prizeToDelete: string) => {
    const updatedPrizes = prizes.filter(
      (prize) => prize.value !== prizeToDelete,
    );
    setPrizes(getPrizeLabels(updatedPrizes));
    bountyPaymentDispatch({ type: 'DELETE_PRIZE', payload: prizeToDelete });
  };

  const isProject = type === 'project';

  const handleSubmit = (mode?: string) => {
    if (mode === 'DRAFT') {
      createDraft();
      return;
    }

    let errorMessage = '';

    if (isProject) {
      bountyPaymentDispatch({
        type: 'UPDATE_REWARDS',
        payload: { first: bountyPayment.rewardAmount || 0 },
      });

      if (!bountyPayment.compensationType) {
        errorMessage = 'Please add a compensation type';
      }

      if (
        bountyPayment.compensationType === 'fixed' &&
        !bountyPayment.rewardAmount
      ) {
        errorMessage = 'Please specify the total reward amount to proceed';
      } else if (bountyPayment.compensationType === 'range') {
        if (!bountyPayment.minRewardAsk || !bountyPayment.maxRewardAsk) {
          errorMessage =
            'Please specify your preferred minimum and maximum compensation range';
        } else if (bountyPayment.maxRewardAsk < bountyPayment.minRewardAsk) {
          errorMessage =
            'The compensation range is incorrect; the maximum must be higher than the minimum. Please adjust it';
        }
      }
    } else {
      const totalPrizes = Object.values(bountyPayment.rewards)
        .map((reward) => reward as number)
        .reduce((a, b) => a + b, 0);

      if (!totalPrizes || bountyPayment.rewardAmount !== totalPrizes) {
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

  switch (bountyPayment.compensationType) {
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
        {isProject && (
          <Box w="100%" mb={4}>
            <FormControl isRequired>
              <Flex>
                <FormLabel
                  color={'brand.slate.500'}
                  fontSize={'15px'}
                  fontWeight={600}
                >
                  Compensation Type
                </FormLabel>
                <Tooltip
                  w="max"
                  p="0.7rem"
                  color="white"
                  fontSize="0.9rem"
                  fontWeight={600}
                  bg="#6562FF"
                  borderRadius="0.5rem"
                  hasArrow
                  label={
                    'Would you like to keep a fixed compensation for this project, or let applicants send in their quotes?'
                  }
                  placement="right-end"
                >
                  <Image
                    mt={-2}
                    alt={'Info Icon'}
                    src={'/assets/icons/info-icon.svg'}
                  />
                </Tooltip>
              </Flex>
              <Select
                color="brand.slate.900"
                borderColor={'brand.slate.300'}
                onChange={(e) => {
                  bountyPaymentDispatch({
                    type: 'UPDATE_COMPENSATION_TYPE',
                    payload: e.target.value,
                  });
                }}
                value={bountyPayment?.compensationType}
              >
                <option selected hidden disabled value="">
                  Select a Compensation Type
                </option>
                <option value="fixed">Fixed Compensation</option>
                <option value="range">Pre-decided Range</option>
                <option value="variable">Variable Compensation</option>
              </Select>
            </FormControl>
            <Text mt={1} color="green.500" fontSize={'xs'}>
              {compensationHelperText}
            </Text>
          </Box>
        )}
        <FormControl isRequired>
          <FormLabel
            color={'brand.slate.500'}
            fontSize={'15px'}
            fontWeight={600}
          >
            Select Token
          </FormLabel>
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
              {bountyPayment.token ? (
                <HStack>
                  <Image
                    w={'1.6rem'}
                    alt={
                      tokenList.find(
                        (token) => token.tokenSymbol === bountyPayment.token,
                      )?.tokenName
                    }
                    rounded={'full'}
                    src={
                      tokenList.find(
                        (token) => token.tokenSymbol === bountyPayment.token,
                      )?.icon
                    }
                  />
                  <Text>
                    {
                      tokenList.find(
                        (token) => token.tokenSymbol === bountyPayment.token,
                      )?.tokenName
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
        {bountyPayment.compensationType === 'fixed' && (
          <FormControl w="full" mt={5} isRequired>
            <FormLabel
              color={'brand.slate.500'}
              fontSize={'15px'}
              fontWeight={600}
            >
              Total {!isProject ? 'Reward Amount' : 'Compensation'} (in{' '}
              {
                tokenList.find(
                  (token) => token.tokenSymbol === bountyPayment.token,
                )?.tokenSymbol
              }
              )
            </FormLabel>

            <NumberInput
              focusBorderColor="brand.purple"
              onChange={(valueString) => handleTotalRewardChange(valueString)}
              value={bountyPayment.rewardAmount || ''}
            >
              <NumberInputField
                color={'brand.slate.800'}
                borderColor="brand.slate.300"
                _placeholder={{
                  color: 'brand.slate.300',
                }}
                placeholder="4,000"
              />
            </NumberInput>
          </FormControl>
        )}
        {bountyPayment.compensationType === 'range' && (
          <Flex gap="3" w="100%">
            <FormControl w="full" mt={5} isRequired>
              <FormLabel
                color={'brand.slate.500'}
                fontSize={'15px'}
                fontWeight={600}
              >
                From
              </FormLabel>

              <NumberInput
                focusBorderColor="brand.purple"
                onChange={(valueString) => handleMinAskChange(valueString)}
                value={bountyPayment.minRewardAsk || ''}
              >
                <NumberInputField
                  color={'brand.slate.800'}
                  borderColor="brand.slate.300"
                  _placeholder={{
                    color: 'brand.slate.300',
                  }}
                  placeholder="Enter the lower range"
                />
              </NumberInput>
            </FormControl>
            <FormControl w="full" mt={5} isRequired>
              <FormLabel
                color={'brand.slate.500'}
                fontSize={'15px'}
                fontWeight={600}
              >
                Upto
              </FormLabel>

              <NumberInput
                focusBorderColor="brand.purple"
                onChange={(valueString) => handleMaxAskChange(valueString)}
                value={bountyPayment.maxRewardAsk || ''}
              >
                <NumberInputField
                  color={'brand.slate.800'}
                  borderColor="brand.slate.300"
                  _placeholder={{
                    color: 'brand.slate.300',
                  }}
                  placeholder="Enter the higher range"
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
                    <Button onClick={() => handlePrizeDelete(el.value)}>
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
          {(isNewOrDraft || isDuplicating) && (
            <Button
              w="100%"
              disabled={isListingPublishing}
              isLoading={isListingPublishing}
              onClick={() => handleSubmit()}
              variant={'solid'}
            >
              Create & Publish Listing
            </Button>
          )}
          <Button
            w="100%"
            isLoading={draftLoading}
            onClick={() =>
              handleSubmit(isNewOrDraft || isDuplicating ? 'DRAFT' : 'EDIT')
            }
            variant={editable ? 'solid' : 'outline'}
          >
            {isNewOrDraft || isDuplicating ? 'Save Draft' : 'Update Listing'}
          </Button>
          <Text color="red.500">{errorMessage}</Text>
        </VStack>
      </VStack>
    </>
  );
};
