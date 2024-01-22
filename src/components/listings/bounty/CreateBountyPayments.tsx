import { AddIcon, ChevronDownIcon, DeleteIcon } from '@chakra-ui/icons';
import {
  Button,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Image,
  Input,
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
  Text,
  useDisclosure,
  VStack,
} from '@chakra-ui/react';
import type { Dispatch, SetStateAction } from 'react';
import { useState } from 'react';
import { Toaster } from 'react-hot-toast';

import type { MultiSelectOptions } from '@/constants';
import { PrizeList, tokenList } from '@/constants';
import { sortRank } from '@/utils/rank';

import type { BountyBasicType } from './Createbounty';
import type { Ques } from './questions/builder';

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
  setBountyPayment: Dispatch<SetStateAction<any | undefined>>;
  isEditMode: boolean;
  isNewOrDraft?: boolean;
  type: 'open' | 'permissioned';
}
export const CreatebountyPayment = ({
  createDraft,
  draftLoading,
  createAndPublishListing,
  isListingPublishing,
  bountyPayment,
  setBountyPayment,
  isEditMode,
  isNewOrDraft,
  type,
}: Props) => {
  const {
    isOpen: confirmIsOpen,
    onOpen: confirmOnOpen,
    onClose: confirmOnClose,
  } = useDisclosure();
  const [isRewardError, setIsRewardError] = useState<boolean>(false);

  // handles the UI for prize
  const prizesList = sortRank(Object.keys(bountyPayment?.rewards || []))?.map(
    (r) => ({
      value: r,
      label: `${r} prize`,
      placeHolder: bountyPayment?.rewards[r],
      defaultValue: bountyPayment?.rewards[r],
    })
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
        ]
  );

  const handleTokenChange = (tokenSymbol: string) => {
    setBountyPayment((prev: any) => ({
      ...prev,
      token: tokenSymbol,
    }));
  };

  const handleTotalRewardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTotalReward = parseInt(e.target.value, 10) || 0;
    setBountyPayment((prev: any) => ({
      ...prev,
      rewardAmount: newTotalReward,
    }));
  };

  const handlePrizeValueChange = (prizeName: string, value: number) => {
    setBountyPayment((prev: any) => ({
      ...prev,
      rewards: {
        ...prev.rewards,
        [prizeName]: value,
      },
    }));
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
      (prize) => prize.value !== prizeToDelete
    );
    setPrizes(getPrizeLabels(updatedPrizes));

    setBountyPayment((prev: any) => {
      const updatedRewards = { ...prev.rewards };
      delete updatedRewards[prizeToDelete];
      return {
        ...prev,
        rewards: updatedRewards,
      };
    });
  };

  const handleSubmit = (isEdit?: boolean, mode?: string) => {
    if (type === 'permissioned') {
      setBountyPayment((prev: any) => ({
        ...prev,
        rewards: { first: prev.rewardAmount },
      }));
      if (isEdit || mode === 'DRAFT') createDraft();
      else confirmOnOpen();
    }

    if (type === 'open') {
      const totalPrizes = Object.values(bountyPayment.rewards)
        .map((reward) => reward as number)
        .reduce((a, b) => a + b, 0);

      if (!totalPrizes || bountyPayment.rewardAmount !== totalPrizes) {
        setIsRewardError(true);
      } else {
        setIsRewardError(false);
        if (isEdit || mode === 'DRAFT') createDraft();
        else confirmOnOpen();
      }
    }
  };

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
        <FormControl isRequired>
          <FormLabel color={'gray.500'}>Select Token</FormLabel>
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
              rightIcon={<ChevronDownIcon />}
            >
              {bountyPayment.token ? (
                <HStack>
                  <Image
                    w={'1.6rem'}
                    alt={
                      tokenList.find(
                        (token) => token.tokenSymbol === bountyPayment.token
                      )?.tokenName
                    }
                    rounded={'full'}
                    src={
                      tokenList.find(
                        (token) => token.tokenSymbol === bountyPayment.token
                      )?.icon
                    }
                  />
                  <Text>
                    {
                      tokenList.find(
                        (token) => token.tokenSymbol === bountyPayment.token
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
        <FormControl w="full" mt={5} isRequired>
          <Flex>
            <FormLabel
              color={'brand.slate.500'}
              fontSize={'15px'}
              fontWeight={600}
              htmlFor={'slug'}
            >
              Total {type === 'open' ? 'Reward Amount' : 'Compensation'} (in{' '}
              {
                tokenList.find(
                  (token) => token.tokenSymbol === bountyPayment.token
                )?.tokenSymbol
              }
              )
            </FormLabel>
          </Flex>

          <Input
            borderColor="brand.slate.300"
            _placeholder={{
              color: 'brand.slate.300',
            }}
            focusBorderColor="brand.purple"
            onChange={handleTotalRewardChange}
            placeholder="4,000"
            type="number"
            value={bountyPayment.rewardAmount || ''}
          />
        </FormControl>
        {type === 'open' && (
          <VStack gap={4} w={'full'} mt={5} mb={8}>
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
                        parseInt(valueString, 10)
                      )
                    }
                  >
                    <NumberInputField
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
        {isRewardError && (
          <Text w="full" color="red" textAlign={'center'}>
            Sorry! Total reward amount should be equal to the sum of all prizes.
          </Text>
        )}
        <Toaster />
        <VStack gap={4} w={'full'} pt={4}>
          {!isEditMode && (
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
            onClick={() => handleSubmit(isEditMode, 'DRAFT')}
            variant={isEditMode ? 'solid' : 'outline'}
          >
            {isNewOrDraft ? 'Save Draft' : 'Update Bounty'}
          </Button>
        </VStack>
      </VStack>
    </>
  );
};
