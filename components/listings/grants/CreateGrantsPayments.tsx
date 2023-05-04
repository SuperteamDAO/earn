import { ChevronDownIcon } from '@chakra-ui/icons';
import {
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
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
import axios from 'axios';
import type { Dispatch, SetStateAction } from 'react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

import type { MultiSelectOptions } from '../../../constants';
import { tokenList } from '../../../constants';
import type { GrantsBasicType, GrantsType } from '../../../interface/listings';
import { SponsorStore } from '../../../store/sponsor';
import { createGrants } from '../../../utils/functions';
import { genrateuuid } from '../../../utils/helpers';

interface Props {
  setSteps?: Dispatch<SetStateAction<number>>;
  editorData: string | undefined;
  mainSkills: MultiSelectOptions[];
  subSkills: MultiSelectOptions[];
  grantsBasic: GrantsBasicType | undefined;
  onOpen: () => void;
  createDraft: (payment: string) => void;
  setSlug: Dispatch<SetStateAction<string>>;
}
export const CreateGrantsPayment = ({
  editorData,
  mainSkills,
  subSkills,
  grantsBasic,
  onOpen,
  setSlug,
}: Props) => {
  const {
    formState: { errors },
    register,
    handleSubmit,
  } = useForm();
  // handles which token is selected
  const [tokenIndex, setTokenIndex] = useState<number | undefined>(undefined);
  // stores the state for prize
  const { currentSponsor } = SponsorStore();
  const [loading, setLoading] = useState<boolean>(false);
  return (
    <>
      <VStack align={'start'} w={'2xl'} pt={7} pb={10} color={'gray.500'}>
        <form
          onSubmit={handleSubmit(async (e) => {
            if (Number(e.max_sal) < Number(e.min_sal)) {
              toast.error('Minimum Grants Cannot Be More Than Maximum Grants');

              return;
            }

            setLoading(true);
            const info: GrantsType = {
              id: genrateuuid(),
              active: true,
              link: grantsBasic?.link ?? '',
              token: tokenList[tokenIndex as number]?.mintAddress || '',
              orgId: currentSponsor?.id ?? '',
              maxSalary: Number(e.max_sal),
              minSalary: Number(e.min_sal),
              contact: grantsBasic?.contact ?? '',
              description: JSON.stringify(editorData),
              skills: JSON.stringify(mainSkills),
              subSkills: JSON.stringify(subSkills),
              source: 'native',
              title: grantsBasic?.title ?? '',
            };
            const res = await createGrants(info);
            if (res && res.data.code === 201) {
              await axios.post('/api/updateSearch');
              onOpen();
              setSlug(
                `/grants/${grantsBasic?.title.split(' ').join('-')}` as string
              );
              setLoading(false);
            } else {
              setLoading(false);
            }
          })}
          style={{ width: '100%' }}
        >
          <FormControl isRequired>
            <FormLabel color={'gray.500'}>Select Token</FormLabel>
            <Menu>
              <MenuButton
                as={Button}
                overflow="hidden"
                w="100%"
                h={'2.6rem'}
                color="gray.400"
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
                color="gray.400"
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
                        }}
                      >
                        <HStack>
                          <Image
                            w={'1.6rem'}
                            alt={token.tokenName}
                            rounded={'full'}
                            src={token.icon}
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
          <HStack my={6}>
            <FormControl w="full" isRequired>
              <Flex>
                <FormLabel
                  color={'gray.500'}
                  fontSize={'15px'}
                  fontWeight={600}
                  htmlFor={'min_sal'}
                >
                  Minimum Grants (USD)
                </FormLabel>
              </Flex>

              <Input
                id="min_sal"
                placeholder="100,000"
                type={'number'}
                {...register('min_sal')}
              />
              <FormErrorMessage>
                {errors.min_sal ? <>{errors.min_sal.message}</> : <></>}
              </FormErrorMessage>
            </FormControl>
            <FormControl w="full" isRequired>
              <Flex>
                <FormLabel
                  color={'gray.500'}
                  fontSize={'15px'}
                  fontWeight={600}
                  htmlFor={'max_sal'}
                >
                  Maximum Grants (USD)
                </FormLabel>
              </Flex>

              <Input
                id="max_sal"
                placeholder="150,000"
                type={'number'}
                {...register('max_sal')}
              />
              <FormErrorMessage>
                {errors.max_sal ? <>{errors.max_sal.message}</> : <></>}
              </FormErrorMessage>
            </FormControl>
          </HStack>
          <VStack gap={6} mt={10}>
            <Button
              w="100%"
              color={'white'}
              fontSize="1rem"
              fontWeight={600}
              bg={'#6562FF'}
              _hover={{ bg: '#6562FF' }}
              disabled={loading}
              isLoading={loading}
              type={'submit'}
            >
              Finish the Listing
            </Button>
            <Button
              w="100%"
              color="gray.500"
              fontSize="1rem"
              fontWeight={600}
              bg="transparent"
              border="1px solid"
              borderColor="gray.200"
            >
              Save as Drafts
            </Button>
          </VStack>
        </form>
      </VStack>
    </>
  );
};
