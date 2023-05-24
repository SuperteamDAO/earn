import { ChevronDownIcon, DeleteIcon } from '@chakra-ui/icons';
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

import type { MultiSelectOptions } from '../../../constants';
import { PrizeList, tokenList } from '../../../constants';
import type { BountyBasicType } from './Createbounty';
import type { Ques } from './questions/builder';

interface PrizeListInterface {
  value: string;
  label: string;
  placeHolder: number;
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
  setBountyPayment: Dispatch<SetStateAction<any | undefined>>;
}
export const CreatebountyPayment = ({
  createDraft,
  draftLoading,
  createAndPublishListing,
  isListingPublishing,
  setBountyPayment,
}: Props) => {
  const {
    isOpen: confirmIsOpen,
    onOpen: confirmOnOpen,
    onClose: confirmOnClose,
  } = useDisclosure();
  // handles which token is selected
  const [tokenIndex, setTokenIndex] = useState<number>(0);
  const [tokenName, setTokenName] = useState(
    tokenList ? tokenList[0]?.tokenSymbol || '' : ''
  );
  const [totalReward, setTotalReward] = useState<number | undefined>();

  // stores the state for prize
  const [prizevalues, setPrizevalues] = useState<any>({});

  // handles the UI for prize
  const [prizes, setPrizes] = useState<PrizeListInterface[]>([
    {
      value: 'first',
      label: 'first prize',
      placeHolder: 2500,
    },
  ]);

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
  };

  // const onSubmit = async () => {
  //   setLoading(true);
  //   const Prizevalues = Object.values(prizevalues as Object);
  //   if (Prizevalues.length <= 0) {
  //     toast.error('Please add atleast one prize');
  //     return;
  //   }

  //   let Prizes: Partial<PrizeListType> = Object();
  //   prizes.forEach((_el, index: number) => {
  //     const Prize: any = {};
  //     if (!PrizeLabels[index]) {
  //       Prize[PrizeLabels[index]!] = Prizevalues[index];
  //     }
  //     Prizes = {
  //       ...Prizes,
  //       ...Prize,
  //     };
  //   });
  //   const bountyId = genrateuuid();
  //   const questionsRes = await createQuestions({
  //     id: genrateuuid(),
  //     bountiesId: bountyId,
  //     questions:
  //       bountyBasic?.type === 'premission'
  //         ? JSON.stringify([...defaultQuestionPremission, ...questions])
  //         : JSON.stringify([...defaultQuestionPremissionLess]),
  //   });

  //   if (questionsRes) {
  //     await axios.post('/api/updateSearch');
  //     onOpen();
  //     setSlug(`/bounties/${bountyBasic?.title.split(' ').join('-')}` as string);
  //     setLoading(false);
  //   } else {
  //     toast.error('Error creating bounty, please try again later.');
  //     setLoading(false);
  //   }
  // };
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
        <VStack gap={2} w={'full'} mt={5} mb={8}>
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
            variant="outline"
          >
            Add Prize
          </Button>
        </VStack>
        <Toaster />
        <VStack gap={4} w={'full'} mt={10}>
          <Button
            w="100%"
            color={'white'}
            fontSize="1rem"
            fontWeight={600}
            bg={'#6562FF'}
            _hover={{ bg: '#6562FF' }}
            disabled={isListingPublishing}
            isLoading={isListingPublishing}
            onClick={confirmOnOpen}
          >
            Create & Publish Listing
          </Button>
          <Button
            w="100%"
            color="gray.500"
            fontSize="1rem"
            fontWeight={600}
            bg="transparent"
            border="1px solid"
            borderColor="gray.200"
            isLoading={draftLoading}
            onClick={() => {
              createDraft();
            }}
          >
            Save as Draft
          </Button>
        </VStack>
      </VStack>
    </>
  );
};
