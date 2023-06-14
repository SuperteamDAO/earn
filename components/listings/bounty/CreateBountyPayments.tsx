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
  Text,
  useDisclosure,
  VStack,
} from '@chakra-ui/react';
import type { Dispatch, SetStateAction } from 'react';
import { useEffect, useState } from 'react';
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
  setSlug: Dispatch<SetStateAction<string>>;
  questions: Ques[];
  createAndPublishListing: () => void;
  isListingPublishing: boolean;
  bountyPayment: any;
  setBountyPayment: Dispatch<SetStateAction<any | undefined>>;
  isEditMode: boolean;
}
export const CreatebountyPayment = ({
  createDraft,
  draftLoading,
  createAndPublishListing,
  isListingPublishing,
  bountyPayment,
  setBountyPayment,
  isEditMode,
}: Props) => {
  const {
    isOpen: confirmIsOpen,
    onOpen: confirmOnOpen,
    onClose: confirmOnClose,
  } = useDisclosure();
  const [isRewardError, setIsRewardError] = useState<boolean>(false);
  // handles which token is selected
  const defaultTokenIndex = tokenList?.findIndex(
    (t) => t.tokenSymbol === bountyPayment.token
  );
  const [tokenName, setTokenName] = useState(
    defaultTokenIndex >= 0
      ? tokenList[defaultTokenIndex]?.tokenSymbol
      : tokenList[0]?.tokenSymbol || ''
  );
  const [tokenIndex, setTokenIndex] = useState<number>(
    defaultTokenIndex >= 0 ? defaultTokenIndex : 0
  );
  const [totalReward, setTotalReward] = useState<number | undefined>(
    bountyPayment?.rewardAmount || undefined
  );

  // stores the state for prize
  const [prizevalues, setPrizevalues] = useState<any>(
    bountyPayment?.rewards || {}
  );

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

  useEffect(() => {
    setBountyPayment({
      rewardAmount: totalReward,
      token: tokenName,
      rewards: prizevalues,
    });
  }, [prizevalues, totalReward, tokenName]);

  const handleButtonClick = () => {
    const temp: PrizeListInterface[] = prizes.filter((_el, index) => {
      if (index !== prizes.length - 1) {
        return true;
      }
      return false;
    });

    setPrizes(temp);
    const newTemp: any = {};
    temp?.forEach((t) => {
      newTemp[t.value] = t.defaultValue || 0;
    });
    setPrizevalues(newTemp);
  };

  const handleSubmit = (isEdit?: boolean, mode?: string) => {
    const rewardAmount: number = (
      (Object.values(prizevalues) || []) as number[]
    ).reduce((a, b) => a + b, 0);
    setBountyPayment({
      rewardAmount: totalReward,
      token: tokenName,
      rewards: prizevalues,
    });
    if (!totalReward || totalReward !== rewardAmount) {
      setIsRewardError(true);
    } else {
      setIsRewardError(false);
      if (isEdit || mode === 'DRAFT') createDraft();
      else confirmOnOpen();
    }
  };

  return (
    <>
      <Modal isOpen={confirmIsOpen} onClose={confirmOnClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Confirm Publish?</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>
              Creating this Listing will publish it for everyone to see. Make
              sure your Listing is ready before you publish.
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
              Create & Publish
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
              {tokenIndex === undefined ? (
                'Select'
              ) : (
                <HStack>
                  <Image
                    w={'1.6rem'}
                    alt={tokenList[tokenIndex as number]?.tokenName}
                    rounded={'full'}
                    src={tokenList[tokenIndex as number]?.icon}
                  />
                  <Text>{tokenList[tokenIndex as number]?.tokenName}</Text>
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
              {tokenList.map((token, index) => {
                return (
                  <>
                    <MenuItem
                      key={token.mintAddress}
                      onClick={() => {
                        setTokenIndex(index);
                        setTokenName(token?.tokenSymbol);
                      }}
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
        <FormControl w="full" isRequired>
          <Flex>
            <FormLabel
              color={'brand.slate.500'}
              fontSize={'15px'}
              fontWeight={600}
              htmlFor={'slug'}
            >
              Total Reward Amount (in {tokenName})
            </FormLabel>
          </Flex>

          <Input
            borderColor="brand.slate.300"
            _placeholder={{
              color: 'brand.slate.300',
            }}
            defaultValue={totalReward}
            focusBorderColor="brand.purple"
            onChange={(e) => {
              setTotalReward(parseInt(e.target.value, 10));
            }}
            placeholder="4,000"
            type="number"
          />
        </FormControl>
        <VStack gap={4} w={'full'} mt={5} mb={8}>
          {prizes.map((el, index) => {
            return (
              <FormControl key={el.label}>
                <FormLabel color={'gray.500'} textTransform="capitalize">
                  {el.label}
                </FormLabel>
                <Flex gap={3}>
                  <Input
                    color="brand.slate.500"
                    borderColor="brand.slate.300"
                    _placeholder={{
                      color: 'brand.slate.300',
                    }}
                    defaultValue={el.defaultValue}
                    focusBorderColor="brand.purple"
                    onChange={(e) => {
                      setPrizevalues({
                        ...(prizevalues as Object),
                        [el.value]: parseInt(e.target.value, 10),
                      });
                    }}
                    placeholder={JSON.stringify(el.placeHolder)}
                    type={'number'}
                  />
                  {index === prizes.length - 1 && (
                    <Button onClick={() => handleButtonClick()}>
                      <DeleteIcon />
                    </Button>
                  )}
                </Flex>
              </FormControl>
            );
          })}
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
        {isRewardError && (
          <Text w="full" color="red" textAlign={'center'}>
            Sorry! Total reward amount should be equal to the sum of all prizes.
          </Text>
        )}
        <Toaster />
        <VStack gap={4} w={'full'} pt={10}>
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
            {isEditMode ? 'Update' : 'Save as Draft'}
          </Button>
        </VStack>
      </VStack>
    </>
  );
};
