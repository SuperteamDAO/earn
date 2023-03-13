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
  Text,
  VStack,
} from '@chakra-ui/react';
import { OutputData } from '@editorjs/editorjs';
import { Dispatch, SetStateAction, useState } from 'react';
import { tokenList, PrizeList, MultiSelectOptions } from '../../../constants';
import { PrizeListType } from '../../../interface/listings';
import { SponsorType } from '../../../interface/sponsor';
import { PrizeLabels } from '../../../interface/types';
import { SponsorStore } from '../../../store/sponsor';
import { createBounty } from '../../../utils/functions';
import { BountyBasicType } from './Createbounty';

interface PrizeList {
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
  createDraft: (payment: string) => void;
  setSlug: Dispatch<SetStateAction<string>>;
}
export const CreatebountyPayment = ({
  bountyBasic,
  editorData,
  mainSkills,
  subSkills,
  onOpen,
  createDraft,
  draftLoading,
  setSlug,
}: Props) => {
  // handles which token is selected
  const [tokenIndex, setTokenIndex] = useState<number | undefined>(undefined);

  // stores the state for prize
  const [prizevalues, setPrizevalues] = useState<Object>({});

  // handles the UI for prize
  const [prizes, setPrizes] = useState<PrizeList[]>([
    {
      label: 'First prize',
      placeHolder: 2500,
    },
  ]);
  // sponsor
  const { currentSponsor } = SponsorStore();
  const [loading, setLoading] = useState<boolean>(false);
  const onSubmit = async () => {
    setLoading(true);
    const Prizevalues = Object.values(prizevalues as Object);
    let amount = 0;
    let Prizes: Partial<PrizeListType> = Object();
    prizes.map((el, index) => {
      amount += Prizevalues[index];
      Prizes = {
        ...Prizes,
        [PrizeLabels[index]]: Prizevalues[index],
      };
    });

    const data = await createBounty(
      {
        active: true,
        bugBounty: false,
        deadline: bountyBasic?.deadline ?? '',
        description: JSON.stringify(editorData),
        featured: false,
        orgId: currentSponsor?.orgId ?? '',
        privateBool: false,
        title: bountyBasic?.title ?? '',
        source: 'native',
        showTop: true,
        sponsorStatus: 'Unassigned',
        prizeList: Prizes,
        amount: JSON.stringify(amount),
        skills: JSON.stringify(mainSkills),
        subSkills: JSON.stringify(subSkills),
        token: tokenList[tokenIndex as number].mintAddress,
        eligibility: bountyBasic?.eligibility ?? '',
        status: 'open',
        slug: (bountyBasic?.title.split(' ').join('-') as string) ?? '',
      },
      currentSponsor as SponsorType
    );

    if (data.data) {
      onOpen();
      setSlug(
        ('/bounties/' + bountyBasic?.title.split(' ').join('-')) as string
      );
      setLoading(false);
    } else {
      setLoading(false);
    }
  };
  return (
    <>
      <VStack pb={10} color={'gray.500'} pt={7} align={'start'} w={'2xl'}>
        <FormControl isRequired>
          <FormLabel color={'gray.500'}>Select Token</FormLabel>
          <Menu>
            <MenuButton
              as={Button}
              rightIcon={<ChevronDownIcon />}
              w="100%"
              h="100%"
              fontSize="1rem"
              height={'2.6rem'}
              fontWeight={500}
              color="gray.400"
              bg="transparent"
              textAlign="start"
              overflow="hidden"
              border={'1px solid #cbd5e1'}
            >
              {tokenIndex === undefined ? (
                'Select'
              ) : (
                <HStack>
                  <Image
                    w={'1.6rem'}
                    rounded={'full'}
                    src={tokenList[tokenIndex as number]?.icon}
                    alt={tokenList[tokenIndex as number]?.tokenName}
                  />
                  <Text>{tokenList[tokenIndex as number]?.tokenName}</Text>
                </HStack>
              )}
            </MenuButton>
            <MenuList
              w="40rem"
              fontSize="1rem"
              fontWeight={500}
              color="gray.400"
              maxHeight="15rem"
              overflow="scroll"
            >
              {tokenList.map((token, index) => {
                return (
                  <>
                    <MenuItem
                      key={token.mintAddress}
                      onClick={() => {
                        setTokenIndex(index);
                      }}
                    >
                      <HStack>
                        <Image
                          w={'1.6rem'}
                          rounded={'full'}
                          src={token.icon}
                          alt={token.tokenName}
                        />
                        <Text>{token.tokenName}</Text>
                      </HStack>
                    </MenuItem>
                  </>
                );
              })}
            </MenuList>
          </Menu>
        </FormControl>
        <VStack gap={2} mt={5} w={'full'}>
          {prizes.map((el, index) => {
            return (
              <FormControl key={el.label}>
                <FormLabel color={'gray.500'}>{el.label}</FormLabel>
                <Flex gap={3}>
                  <Input
                    type={'number'}
                    onChange={(e) => {
                      setPrizevalues({
                        ...(prizevalues as Object),
                        [el.label]: e.target.value,
                      });
                    }}
                    placeholder={JSON.stringify(el.placeHolder)}
                  />
                  {index === prizes.length - 1 && (
                    <Button
                      onClick={() => {
                        let temp: PrizeList[] = [];
                        prizes.map((el, index) => {
                          if (index !== prizes.length - 1) {
                            temp.push(el);
                          } else {
                            const a = prizevalues;
                          }
                        });

                        setPrizes(temp);
                      }}
                    >
                      <DeleteIcon />
                    </Button>
                  )}
                </Flex>
              </FormControl>
            );
          })}
          <Button
            isDisabled={prizes.length === 5 && true}
            bg={'transparent'}
            w="full"
            border={'1px solid #e2e8f0'}
            onClick={() => {
              setPrizes([
                ...prizes,
                {
                  label: PrizeList[prizes.length] + ' ' + 'prize',
                  placeHolder: (5 - prizes.length) * 500,
                },
              ]);
            }}
          >
            Add Prize
          </Button>
        </VStack>
        <VStack w={'full'} gap={6} mt={10}>
          <Button
            w="100%"
            bg={'#6562FF'}
            _hover={{ bg: '#6562FF' }}
            color={'white'}
            fontSize="1rem"
            fontWeight={600}
            onClick={onSubmit}
            isLoading={loading}
            disabled={loading}
          >
            Finish the listing
          </Button>
          <Button
            w="100%"
            fontSize="1rem"
            fontWeight={600}
            color="gray.500"
            border="1px solid"
            borderColor="gray.200"
            isLoading={draftLoading}
            bg="transparent"
            onClick={() => {
              createDraft(
                JSON.stringify({
                  prizevalues,
                  token: tokenList[tokenIndex as number].mintAddress,
                })
              );
            }}
          >
            Save as Drafts
          </Button>
        </VStack>
      </VStack>
    </>
  );
};
